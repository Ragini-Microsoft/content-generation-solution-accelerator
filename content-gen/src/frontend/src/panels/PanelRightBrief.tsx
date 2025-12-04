import React from "react";
import PanelRight from "../components/Panels/PanelRight";
import { Button } from "@fluentui/react-components";
import { DocumentEdit20Filled, MoreHorizontalRegular } from "@fluentui/react-icons";
import PanelRightToolbar from "../components/Panels/PanelRightToolbar";
import { BriefConfirmation } from "../components/BriefConfirmation";
import type { CreativeBrief } from "../types";

interface PanelRightBriefProps {
  pendingBrief: CreativeBrief | null;
  onConfirm: (brief: CreativeBrief) => void;
  onCancel: () => void;
  onEdit: (brief: CreativeBrief) => void;
}

const PanelRightBrief: React.FC<PanelRightBriefProps> = ({
  pendingBrief,
  onConfirm,
  onCancel,
  onEdit
}) => {
  if (!pendingBrief) return null;

  return (
    <PanelRight 
      panelWidth={400}
      defaultClosed={false}
      panelResize={true}
      panelType="second"
    >
      <PanelRightToolbar
        panelTitle="Creative Brief"
        panelIcon={<DocumentEdit20Filled />}
      >
        <Button appearance="subtle" icon={<MoreHorizontalRegular />} />
      </PanelRightToolbar>
      <div style={{ padding: "0 16px 16px 16px", overflowY: "auto" }}>
        <BriefConfirmation
          brief={pendingBrief}
          onConfirm={onConfirm}
          onCancel={onCancel}
          onEdit={onEdit}
        />
      </div>
    </PanelRight>
  );
};

export default PanelRightBrief;



