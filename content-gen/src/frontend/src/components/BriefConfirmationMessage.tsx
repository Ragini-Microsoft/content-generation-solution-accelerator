import { useState } from 'react';
import {
  Button,
  Input,
  Textarea,
  Text,
  tokens,
} from '@fluentui/react-components';
import {
  Checkmark20Regular,
  Dismiss20Regular,
  Edit20Regular,
} from '@fluentui/react-icons';
import type { CreativeBrief } from '../types';

interface BriefConfirmationMessageProps {
  brief: CreativeBrief;
  onConfirm: (brief: CreativeBrief) => void;
  onCancel: () => void;
  onEdit: (brief: CreativeBrief) => void;
}

export function BriefConfirmationMessage({
  brief,
  onConfirm,
  onCancel,
  onEdit,
}: BriefConfirmationMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedBrief, setEditedBrief] = useState<CreativeBrief>(brief);

  const handleFieldChange = (field: keyof CreativeBrief, value: string) => {
    setEditedBrief(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = () => {
    onEdit(editedBrief);
    setIsEditing(false);
  };

  const briefFields: { key: keyof CreativeBrief; label: string; multiline?: boolean }[] = [
    { key: 'overview', label: 'Overview', multiline: true },
    { key: 'objectives', label: 'Objectives', multiline: true },
    { key: 'target_audience', label: 'Target Audience' },
    { key: 'key_message', label: 'Key Message', multiline: true },
    { key: 'tone_and_style', label: 'Tone & Style' },
    { key: 'deliverable', label: 'Deliverable' },
    { key: 'timelines', label: 'Timelines' },
    { key: 'visual_guidelines', label: 'Visual Guidelines', multiline: true },
    { key: 'cta', label: 'Call to Action' },
  ];

  return (
    <div className="brief-confirmation-message">
      <div className="brief-header">
        <Text weight="semibold" size={400}>Creative Brief</Text>
        {!isEditing && (
          <Button
            appearance="subtle"
            icon={<Edit20Regular />}
            size="small"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        )}
      </div>
      
      <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginBottom: '12px', display: 'block' }}>
        Review and confirm before generating content.
      </Text>
      
      <div className="brief-fields">
        {briefFields.map(({ key, label, multiline }) => (
          <div key={key} className="brief-field">
            <Text weight="semibold" size={200} className="field-label">
              {label}
            </Text>
            {isEditing ? (
              multiline ? (
                <Textarea
                  value={editedBrief[key]}
                  onChange={(e) => handleFieldChange(key, e.target.value)}
                  resize="vertical"
                  size="small"
                  style={{ width: '100%' }}
                />
              ) : (
                <Input
                  value={editedBrief[key]}
                  onChange={(e) => handleFieldChange(key, e.target.value)}
                  size="small"
                  style={{ width: '100%' }}
                />
              )
            ) : (
              <Text 
                size={200}
                style={{ 
                  color: brief[key] ? tokens.colorNeutralForeground1 : tokens.colorNeutralForeground4,
                  fontStyle: brief[key] ? 'normal' : 'italic'
                }}
              >
                {brief[key] || 'Not specified'}
              </Text>
            )}
          </div>
        ))}
      </div>
      
      <div className="brief-actions">
        {isEditing ? (
          <>
            <Button
              appearance="primary"
              icon={<Checkmark20Regular />}
              size="small"
              onClick={handleSaveEdit}
            >
              Save Changes
            </Button>
            <Button
              appearance="subtle"
              size="small"
              onClick={() => {
                setEditedBrief(brief);
                setIsEditing(false);
              }}
            >
              Cancel Edit
            </Button>
          </>
        ) : (
          <>
            <Button
              appearance="primary"
              icon={<Checkmark20Regular />}
              size="small"
              onClick={() => onConfirm(brief)}
            >
              Confirm & Generate
            </Button>
            <Button
              appearance="subtle"
              icon={<Dismiss20Regular />}
              size="small"
              onClick={onCancel}
            >
              Start Over
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default BriefConfirmationMessage;

