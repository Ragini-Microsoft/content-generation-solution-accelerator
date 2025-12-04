import React from "react";
import PanelRight from "../components/Panels/PanelRight";
import { Button } from "@fluentui/react-components";
import { Box20Filled, MoreHorizontalRegular } from "@fluentui/react-icons";
import PanelRightToolbar from "../components/Panels/PanelRightToolbar";
import { ProductSelector } from "../components/ProductSelector";
import type { Product } from "../types";

interface PanelRightProductsProps {
  selectedProducts: Product[];
  onProductsChange: (products: Product[]) => void;
  onGenerate: () => void;
  isLoading: boolean;
  isVisible: boolean;
}

const PanelRightProducts: React.FC<PanelRightProductsProps> = ({
  selectedProducts,
  onProductsChange,
  onGenerate,
  isLoading,
  isVisible
}) => {
  if (!isVisible) return null;

  return (
    <PanelRight 
      panelWidth={400}
      defaultClosed={false}
      panelResize={true}
      panelType="third"
    >
      <PanelRightToolbar
        panelTitle="Select Products"
        panelIcon={<Box20Filled />}
      >
        <Button appearance="subtle" icon={<MoreHorizontalRegular />} />
      </PanelRightToolbar>
      <div style={{ padding: "0 16px 16px 16px", overflowY: "auto" }}>
        <ProductSelector
          selectedProducts={selectedProducts}
          onProductsChange={onProductsChange}
          onGenerate={onGenerate}
          isLoading={isLoading}
        />
      </div>
    </PanelRight>
  );
};

export default PanelRightProducts;



