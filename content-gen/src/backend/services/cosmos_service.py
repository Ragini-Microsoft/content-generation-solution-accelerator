"""
CosmosDB Service - Manages products and conversation storage.

Provides async operations for:
- Product catalog (CRUD operations)
- Conversation history
- Creative brief storage
"""

import logging
from typing import Any, List, Optional
from datetime import datetime, timezone

from azure.cosmos.aio import CosmosClient, ContainerProxy
from azure.identity.aio import DefaultAzureCredential, ManagedIdentityCredential

from backend.settings import app_settings
from backend.models import Product, CreativeBrief

logger = logging.getLogger(__name__)


class CosmosDBService:
    """Service for interacting with Azure Cosmos DB."""
    
    def __init__(self):
        self._client: Optional[CosmosClient] = None
        self._products_container: Optional[ContainerProxy] = None
        self._conversations_container: Optional[ContainerProxy] = None
    
    async def _get_credential(self):
        """Get Azure credential for authentication."""
        client_id = app_settings.base_settings.azure_client_id
        if client_id:
            return ManagedIdentityCredential(client_id=client_id)
        return DefaultAzureCredential()
    
    async def initialize(self) -> None:
        """Initialize CosmosDB client and containers."""
        if self._client:
            return
        
        credential = await self._get_credential()
        
        self._client = CosmosClient(
            url=app_settings.cosmos.endpoint,
            credential=credential
        )
        
        database = self._client.get_database_client(
            app_settings.cosmos.database_name
        )
        
        self._products_container = database.get_container_client(
            app_settings.cosmos.products_container
        )
        
        self._conversations_container = database.get_container_client(
            app_settings.cosmos.conversations_container
        )
        
        logger.info("CosmosDB service initialized")
    
    async def close(self) -> None:
        """Close the CosmosDB client."""
        if self._client:
            await self._client.close()
            self._client = None
    
    # ==================== Product Operations ====================
    
    async def get_product_by_sku(self, sku: str) -> Optional[Product]:
        """
        Retrieve a product by its SKU.
        
        Args:
            sku: Product SKU identifier
        
        Returns:
            Product if found, None otherwise
        """
        await self.initialize()
        
        query = "SELECT * FROM c WHERE c.sku = @sku"
        params = [{"name": "@sku", "value": sku}]
        
        items = []
        async for item in self._products_container.query_items(
            query=query,
            parameters=params
        ):
            items.append(item)
        
        if items:
            return Product(**items[0])
        return None
    
    async def get_products_by_category(
        self,
        category: str,
        sub_category: Optional[str] = None,
        limit: int = 10
    ) -> List[Product]:
        """
        Retrieve products by category.
        
        Args:
            category: Product category
            sub_category: Optional sub-category filter
            limit: Maximum number of products to return
        
        Returns:
            List of matching products
        """
        await self.initialize()
        
        if sub_category:
            query = """
                SELECT TOP @limit * FROM c 
                WHERE c.category = @category AND c.sub_category = @sub_category
            """
            params = [
                {"name": "@category", "value": category},
                {"name": "@sub_category", "value": sub_category},
                {"name": "@limit", "value": limit}
            ]
        else:
            query = "SELECT TOP @limit * FROM c WHERE c.category = @category"
            params = [
                {"name": "@category", "value": category},
                {"name": "@limit", "value": limit}
            ]
        
        products = []
        async for item in self._products_container.query_items(
            query=query,
            parameters=params
        ):
            products.append(Product(**item))
        
        return products
    
    async def search_products(
        self,
        search_term: str,
        limit: int = 10
    ) -> List[Product]:
        """
        Search products by name or description.
        
        Args:
            search_term: Text to search for
            limit: Maximum number of products to return
        
        Returns:
            List of matching products
        """
        await self.initialize()
        
        search_lower = search_term.lower()
        query = """
            SELECT TOP @limit * FROM c 
            WHERE CONTAINS(LOWER(c.product_name), @search) 
               OR CONTAINS(LOWER(c.marketing_description), @search)
               OR CONTAINS(LOWER(c.detailed_spec_description), @search)
        """
        params = [
            {"name": "@search", "value": search_lower},
            {"name": "@limit", "value": limit}
        ]
        
        products = []
        async for item in self._products_container.query_items(
            query=query,
            parameters=params
        ):
            products.append(Product(**item))
        
        return products
    
    async def upsert_product(self, product: Product) -> Product:
        """
        Create or update a product.
        
        Args:
            product: Product to upsert
        
        Returns:
            The upserted product
        """
        await self.initialize()
        
        item = product.model_dump()
        item["id"] = product.sku  # Use SKU as document ID
        item["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        result = await self._products_container.upsert_item(item)
        return Product(**result)
    
    async def get_all_products(self, limit: int = 100) -> List[Product]:
        """
        Retrieve all products.
        
        Args:
            limit: Maximum number of products to return
        
        Returns:
            List of all products
        """
        await self.initialize()
        
        query = "SELECT TOP @limit * FROM c"
        params = [{"name": "@limit", "value": limit}]
        
        products = []
        async for item in self._products_container.query_items(
            query=query,
            parameters=params
        ):
            products.append(Product(**item))
        
        return products
    
    # ==================== Conversation Operations ====================
    
    async def get_conversation(
        self,
        conversation_id: str,
        user_id: str
    ) -> Optional[dict]:
        """
        Retrieve a conversation by ID.
        
        Args:
            conversation_id: Unique conversation identifier
            user_id: User ID for partition key
        
        Returns:
            Conversation data if found
        """
        await self.initialize()
        
        try:
            item = await self._conversations_container.read_item(
                item=conversation_id,
                partition_key=user_id
            )
            logger.info(f"Retrieved conversation {conversation_id}: {len(item.get('messages', []))} messages, title: {item.get('title', 'N/A')}")
            return item
        except Exception as e:
            logger.warning(f"Failed to retrieve conversation {conversation_id} for user {user_id}: {e}")
            return None
    
    async def save_conversation(
        self,
        conversation_id: str,
        user_id: str,
        messages: List[dict],
        brief: Optional[CreativeBrief] = None,
        metadata: Optional[dict] = None
    ) -> dict:
        """
        Save or update a conversation.
        
        Args:
            conversation_id: Unique conversation identifier
            user_id: User ID for partition key
            messages: List of conversation messages (will be merged with existing if conversation exists)
            brief: Associated creative brief
            metadata: Additional metadata (will be merged with existing)
        
        Returns:
            The saved conversation document
        """
        await self.initialize()
        
        existing = await self.get_conversation(conversation_id, user_id)
        
        if existing:
            existing_messages = existing.get("messages", [])
            if messages:
                existing_content_timestamps = {
                    (msg.get("content", ""), msg.get("timestamp", "")) 
                    for msg in existing_messages
                }
                for msg in messages:
                    msg_key = (msg.get("content", ""), msg.get("timestamp", ""))
                    if msg_key not in existing_content_timestamps:
                        existing_messages.append(msg)
                        existing_content_timestamps.add(msg_key)
            final_messages = existing_messages if existing_messages else messages
            title = existing.get("title")
            existing_metadata = existing.get("metadata", {})
            if metadata:
                existing_metadata.update(metadata)
            metadata = existing_metadata
            created_at = existing.get("created_at")
        else:
            final_messages = messages
            title = None
            created_at = datetime.now(timezone.utc).isoformat()
        
        if not title and final_messages:
            first_user_message = next(
                (msg for msg in final_messages if msg.get("role") == "user"),
                None
            )
            if first_user_message:
                title = self._generate_title_from_message(first_user_message.get("content", ""))
        
        item = {
            "id": conversation_id,
            "user_id": user_id,
            "title": title or "New Conversation",
            "messages": final_messages,
            "brief": brief.model_dump() if brief else (existing.get("brief") if existing else None),
            "metadata": metadata or {},
            "created_at": created_at or datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        result = await self._conversations_container.upsert_item(item)
        logger.info(f"Saved conversation {conversation_id}: {len(result.get('messages', []))} messages, title: '{result.get('title', 'N/A')}'")
        return result
    
    def _generate_title_from_message(self, message_content: str) -> str:
        """
        Generate a conversation title from the first user message.
        
        Args:
            message_content: The first user message content
        
        Returns:
            A short title (max 60 characters)
        """
        if not message_content:
            return "New Conversation"
        
        content = message_content.strip()
        
        if len(content) <= 60:
            return content
        
        words = content.split()
        title_words = []
        current_length = 0
        
        for word in words:
            if current_length + len(word) + 1 <= 57:
                title_words.append(word)
                current_length += len(word) + 1
            else:
                break
        
        title = " ".join(title_words)
        if len(title) < len(content):
            title += "..."
        
        return title
    
    async def add_message_to_conversation(
        self,
        conversation_id: str,
        user_id: str,
        message: dict
    ) -> dict:
        """
        Add a message to an existing conversation.
        
        Args:
            conversation_id: Unique conversation identifier
            user_id: User ID for partition key
            message: Message to add
        
        Returns:
            Updated conversation document
        """
        await self.initialize()
        
        conversation = await self.get_conversation(conversation_id, user_id)
        
        if conversation:
            conversation["messages"].append(message)
            conversation["updated_at"] = datetime.now(timezone.utc).isoformat()
            if not conversation.get("title") or conversation.get("title") == "New Conversation":
                first_user_message = next(
                    (msg for msg in conversation.get("messages", []) if msg.get("role") == "user"),
                    None
                )
                if first_user_message:
                    message_content = first_user_message.get("content", "") or first_user_message.get("text", "")
                    conversation["title"] = self._generate_title_from_message(message_content)
                    logger.info(f"Updating conversation {conversation_id} title to: '{conversation['title']}'")
        else:
            message_content = message.get("content", "") or message.get("text", "")
            title = self._generate_title_from_message(message_content)
            logger.info(f"Creating new conversation {conversation_id} with title: '{title}' from message: '{message_content[:50]}...'")
            conversation = {
                "id": conversation_id,
                "user_id": user_id,
                "title": title,
                "messages": [message],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        
        result = await self._conversations_container.upsert_item(conversation)
        logger.info(f"Saved conversation {conversation_id} with title: '{result.get('title', 'N/A')}', {len(result.get('messages', []))} messages")
        return result
    
    async def get_user_conversations(
        self,
        user_id: str,
        limit: int = 20
    ) -> List[dict]:
        """
        Get all conversations for a user.
        
        Args:
            user_id: User ID
            limit: Maximum number of conversations
        
        Returns:
            List of conversations
        """
        await self.initialize()
        
        query = """
            SELECT TOP @limit c.id, c.user_id, c.title, c.updated_at, c.created_at,
                   ARRAY_LENGTH(c.messages) as message_count
            FROM c 
            WHERE c.user_id = @user_id
            ORDER BY c.updated_at DESC
        """
        params = [
            {"name": "@user_id", "value": user_id},
            {"name": "@limit", "value": limit}
        ]
        
        conversations = []
        async for item in self._conversations_container.query_items(
            query=query,
            parameters=params
        ):
            conversations.append(item)
        
        return conversations


# Singleton instance
_cosmos_service: Optional[CosmosDBService] = None


async def get_cosmos_service() -> CosmosDBService:
    """Get or create the singleton CosmosDB service instance."""
    global _cosmos_service
    if _cosmos_service is None:
        _cosmos_service = CosmosDBService()
        await _cosmos_service.initialize()
    return _cosmos_service
