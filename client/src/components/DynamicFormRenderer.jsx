import React from 'react';

const DynamicFormRenderer = ({ form, values = {}, onChange, readOnly = false }) => {
  if (!form || !form.sections) return null;

  const handleFieldChange = (key, val) => {
    if (readOnly) return;
    onChange({ ...values, [key]: val });
  };

  const isFieldVisible = (field) => {
    if (!field.visibleWhen || !field.visibleWhen.fieldKey) return true;
    const { fieldKey, operator, value } = field.visibleWhen;
    const currentVal = values[fieldKey];

    switch (operator) {
      case 'equals':
        return currentVal === value;
      case 'notEquals':
        return currentVal !== value;
      case 'contains':
        return Array.isArray(currentVal) ? currentVal.includes(value) : String(currentVal).includes(value);
      default:
        return true;
    }
  };

  return (
    <div className="dynamic-form-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {form.sections.map((section) => (
        <div key={section.sectionId} className="card" style={{ padding: '16px', background: '#fafafa' }}>
          <h4 style={{ fontSize: '14px', marginBottom: '14px', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
            {section.title}
          </h4>
          <div className="form-row">
            {(section.fields || []).filter(isFieldVisible).map((field) => {
              const currentVal = values[field.key] !== undefined ? values[field.key] : (field.defaultValue !== undefined ? field.defaultValue : '');

              return (
                <div key={field.fieldId} className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>
                    {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                  </label>

                  {/* Text, Phone, Email */}
                  {['text', 'phone', 'email'].includes(field.type) && (
                    <input
                      type={field.type === 'phone' ? 'tel' : field.type}
                      className="form-input"
                      placeholder={field.placeholder || ''}
                      value={currentVal}
                      disabled={readOnly}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    />
                  )}

                  {/* Number */}
                  {['number', 'decimal'].includes(field.type) && (
                    <input
                      type="number"
                      step={field.type === 'decimal' ? '0.01' : '1'}
                      className="form-input"
                      placeholder={field.placeholder || ''}
                      value={currentVal}
                      disabled={readOnly}
                      onChange={(e) => handleFieldChange(field.key, parseFloat(e.target.value) || 0)}
                    />
                  )}

                  {/* Textarea */}
                  {field.type === 'textarea' && (
                    <textarea
                      rows={3}
                      className="form-textarea"
                      placeholder={field.placeholder || ''}
                      value={currentVal}
                      disabled={readOnly}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    />
                  )}

                  {/* Select */}
                  {field.type === 'select' && (
                    <select
                      className="form-select"
                      value={currentVal}
                      disabled={readOnly}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    >
                      <option value="">Select an option...</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}

                  {/* Boolean / Switch */}
                  {field.type === 'boolean' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '6px' }}>
                      <input
                        type="checkbox"
                        checked={!!currentVal}
                        disabled={readOnly}
                        onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <span style={{ fontSize: '13px' }}>{currentVal ? 'Yes' : 'No'}</span>
                    </label>
                  )}

                  {/* Date */}
                  {field.type === 'date' && (
                    <input
                      type="date"
                      className="form-input"
                      value={currentVal}
                      disabled={readOnly}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DynamicFormRenderer;
