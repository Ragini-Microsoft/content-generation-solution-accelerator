import {
  Button,
  Text,
  Badge,
  tokens,
} from '@fluentui/react-components';
import {
  CheckmarkCircle24Regular,
  Warning24Regular,
  Info24Regular,
  ErrorCircle24Regular,
  Copy24Regular,
  ArrowDownload24Regular,
  ArrowSync24Regular,
} from '@fluentui/react-icons';
import type { GeneratedContent, ComplianceViolation } from '../types';

interface GeneratedContentMessageProps {
  content: GeneratedContent;
  onRegenerate?: () => void;
}

export function GeneratedContentMessage({ content, onRegenerate }: GeneratedContentMessageProps) {
  const { text_content, image_content, violations, requires_modification } = content;

  const handleCopyText = () => {
    const textToCopy = [
      text_content?.headline && `Headline: ${text_content.headline}`,
      text_content?.body && `Body: ${text_content.body}`,
      text_content?.cta_text && `CTA: ${text_content.cta_text}`,
      text_content?.tagline && `Tagline: ${text_content.tagline}`,
    ].filter(Boolean).join('\n\n');
    
    navigator.clipboard.writeText(textToCopy);
  };

  const handleDownloadImage = () => {
    if (image_content?.image_url) {
      const link = document.createElement('a');
      link.href = image_content.image_url;
      link.download = 'generated-image.png';
      link.click();
    }
  };

  return (
    <div className="generated-content-message">
      <div className="generated-content-header">
        <Text weight="semibold" size={400}>Generated Content</Text>
        <div className="generated-content-status">
          {requires_modification ? (
            <Badge appearance="filled" color="danger" icon={<ErrorCircle24Regular />}>
              Requires Modification
            </Badge>
          ) : violations && violations.length > 0 ? (
            <Badge appearance="filled" color="warning" icon={<Warning24Regular />}>
              Review Recommended
            </Badge>
          ) : (
            <Badge appearance="filled" color="success" icon={<CheckmarkCircle24Regular />}>
              Approved
            </Badge>
          )}
        </div>
      </div>

      {image_content?.image_url && (
        <div className="generated-image-container">
          <img
            src={image_content.image_url}
            alt={image_content.alt_text || 'Generated marketing image'}
            className="generated-image"
          />
          <Button
            appearance="subtle"
            icon={<ArrowDownload24Regular />}
            size="small"
            onClick={handleDownloadImage}
            className="image-download-btn"
          >
            Download
          </Button>
        </div>
      )}

      {text_content && (
        <div className="generated-text-content">
          {text_content.headline && (
            <div className="content-field">
              <Text size={100} className="field-label">Headline</Text>
              <Text size={400} weight="bold" block>{text_content.headline}</Text>
            </div>
          )}
          
          {text_content.body && (
            <div className="content-field">
              <Text size={100} className="field-label">Body</Text>
              <Text size={200} block>{text_content.body}</Text>
            </div>
          )}
          
          {text_content.cta_text && (
            <div className="content-field">
              <Text size={100} className="field-label">Call to Action</Text>
              <Text size={200} weight="semibold" block style={{ color: tokens.colorBrandForeground1 }}>
                {text_content.cta_text}
              </Text>
            </div>
          )}
          
          {text_content.tagline && (
            <div className="content-field">
              <Text size={100} className="field-label">Tagline</Text>
              <Text size={200} italic block>{text_content.tagline}</Text>
            </div>
          )}
        </div>
      )}

      {violations && violations.length > 0 && (
        <div className="violations-section">
          <Text size={200} weight="semibold" style={{ marginBottom: '8px', display: 'block' }}>
            Compliance Notes
          </Text>
          {violations.map((violation, index) => (
            <ViolationItem key={index} violation={violation} />
          ))}
        </div>
      )}

      <div className="generated-content-actions">
        <Button
          appearance="subtle"
          icon={<Copy24Regular />}
          size="small"
          onClick={handleCopyText}
        >
          Copy Text
        </Button>
        {onRegenerate && (
          <Button
            appearance="subtle"
            icon={<ArrowSync24Regular />}
            size="small"
            onClick={onRegenerate}
          >
            Regenerate
          </Button>
        )}
      </div>
    </div>
  );
}

function ViolationItem({ violation }: { violation: ComplianceViolation }) {
  const getIcon = () => {
    switch (violation.severity) {
      case 'error':
        return <ErrorCircle24Regular style={{ color: '#d13438', fontSize: '16px' }} />;
      case 'warning':
        return <Warning24Regular style={{ color: '#ffb900', fontSize: '16px' }} />;
      default:
        return <Info24Regular style={{ color: '#0078d4', fontSize: '16px' }} />;
    }
  };

  return (
    <div className={`violation-item violation-${violation.severity}`}>
      {getIcon()}
      <div>
        <Text size={200}>{violation.message}</Text>
        {violation.suggestion && (
          <Text size={100} style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
            {violation.suggestion}
          </Text>
        )}
      </div>
    </div>
  );
}

export default GeneratedContentMessage;

