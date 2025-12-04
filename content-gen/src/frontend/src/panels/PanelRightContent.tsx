import React from "react";
import PanelRight from "../components/Panels/PanelRight";
import { Button } from "@fluentui/react-components";
import { ImageSparkle20Filled, MoreHorizontalRegular } from "@fluentui/react-icons";
import PanelRightToolbar from "../components/Panels/PanelRightToolbar";
import { ContentPreview } from "../components/ContentPreview";
import type { GeneratedContent } from "../types";

interface PanelRightContentProps {
  generatedContent: GeneratedContent | null;
  onRegenerate: () => void;
}

const PanelRightContent: React.FC<PanelRightContentProps> = ({
  generatedContent,
  onRegenerate
}) => {
  if (!generatedContent) return null;

  return (
    <PanelRight 
      panelWidth={450}
      defaultClosed={false}
      panelResize={true}
      panelType="fourth"
    >
      <PanelRightToolbar
        panelTitle="Generated Content"
        panelIcon={<ImageSparkle20Filled />}
      >
        <Button appearance="subtle" icon={<MoreHorizontalRegular />} />
      </PanelRightToolbar>
      <div style={{ padding: "0 16px 16px 16px", overflowY: "auto" }}>
        <ContentPreview
          content={generatedContent}
          onRegenerate={onRegenerate}
        />
      </div>
    </PanelRight>
  );
};

export default PanelRightContent;



