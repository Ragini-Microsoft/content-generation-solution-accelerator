import React from "react";
import PanelRight from "../components/Panels/PanelRight";
import ChatHistoryPanel from "../components/ChatHistory/ChatHistoryPanel";

const PanelRightHistory: React.FC = () => {
  return (
    <PanelRight 
      panelWidth={280}
      defaultClosed={false}
      panelResize={true}
      panelType="first"
    >
      <div style={{ padding: "16px", height: "100%", boxSizing: "border-box" }}>
        <ChatHistoryPanel />
      </div>
    </PanelRight>
  );
};

export default PanelRightHistory;



