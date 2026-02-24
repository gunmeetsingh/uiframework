"use client";
import React, { useState } from 'react';
import { Form, Input, Button, Select, Checkbox, DatePicker, Table, Space, Popconfirm, message, Card, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, LeftOutlined } from '@ant-design/icons';
import * as Icons from '@ant-design/icons';
import { brandingConfig } from '@/branding.config';
import dayjs from 'dayjs';
import { Guard } from '@/components/Access/Guard';
import { useSession } from 'next-auth/react';

interface Option {
    label: string;
    value: string;
}

interface FieldSchema {
    name: string;
    label: string;
    type: 'text' | 'number' | 'email' | 'select' | 'multi-select' | 'checkbox' | 'date';
    options?: Option[];
    required?: boolean;
    showInList?: boolean;
    primary?: boolean;
    hidden?: boolean;
}

interface ConfigSchema {
    title: string;
    endpoint?: string;
    permissions?: {
        create?: string;
        update?: string;
        delete?: string;
    };
    fields: FieldSchema[];
}

export const ConfigEngine = ({ schema, initialData = [] }: { schema: any, initialData?: any[] }) => {
    const { data: session } = useSession();

    // Permission priority: schema.permissions > schema.permission > default
    const permissions = schema.permissions || {
        create: schema.permission || 'node:create',
        update: schema.permission || 'node:update',
        delete: schema.permission || 'node:delete'
    };

    // Mode state: 'list' or 'form'
    const [mode, setMode] = useState<'list' | 'form'>('list');

    // Data state for the list view
    const [data, setData] = useState<any[]>(initialData);

    // Selection state for bulk delete
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    // Editing state
    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // -- Data Fetching --
    React.useEffect(() => {
        const fetchData = async () => {
            if (!schema.endpoint) return;
            setLoading(true);
            try {
                const response = await fetch(schema.endpoint);
                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                }
            } catch (error) {
                console.error("Failed to fetch configuration data:", error);
                message.error("Failed to load data from server");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [schema.endpoint]);

    // -- Handlers --

    const handleAddNew = () => {
        setEditingRecord(null);
        form.resetFields();
        setMode('form');
    };

    const handleEdit = (record: any) => {
        setEditingRecord(record);
        const formValues = { ...record };

        // Generic date transformation based on schema
        schema.fields.forEach((field: any) => {
            if (field.type === 'date' && formValues[field.name]) {
                formValues[field.name] = dayjs(formValues[field.name]);
            }
        });

        form.setFieldsValue(formValues);
        setMode('form');
    };

    const handleDelete = async (record: any) => {
        if (!schema.endpoint) {
            setData(prev => prev.filter(item => item !== record));
            message.success('Configuration deleted locally');
            return;
        }

        setLoading(true);
        try {
            // Send primary fields as identifiers
            const primaryFields = schema.fields.filter((f: any) => f.primary);
            const identifiers = primaryFields.reduce((acc: any, f: any) => {
                acc[f.name] = record[f.name];
                return acc;
            }, {});

            const response = await fetch(schema.endpoint, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(identifiers),
            });

            if (response.ok) {
                setData(prev => prev.filter(item => item !== record));
                message.success('Configuration deleted');
            } else {
                const error = await response.json();
                message.error(`Delete Failed: ${error.error || error.message || 'Unknown server error'}`);
            }
        } catch (error: any) {
            console.error("Delete failed:", error);
            message.error(`Connection Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = () => {
        // Bulk delete implementation would need an API endpoint that supports it
        message.warning('Bulk delete not yet implemented for persistent storage');
    };

    const onFinish = async (values: any) => {
        const processedValues = { ...values };

        // Generic date transformation based on schema
        schema.fields.forEach((field: any) => {
            if (field.type === 'date' && processedValues[field.name]) {
                processedValues[field.name] = processedValues[field.name].format('YYYY-MM-DD');
            }
        });

        if (!schema.endpoint) {
            if (editingRecord) {
                setData(prev => prev.map(item => item === editingRecord ? { ...item, ...processedValues } : item));
                message.success('Configuration updated locally');
            } else {
                const newRecord = { ...processedValues, id: Date.now().toString() };
                setData(prev => [...prev, newRecord]);
                message.success('Configuration created locally');
            }
            setMode('list');
            return;
        }

        setLoading(true);
        try {
            const method = editingRecord ? 'PUT' : 'POST';

            // For PUT, include the identifiers from the editing record
            const payload = editingRecord
                ? { ...processedValues, _identifiers: schema.fields.filter((f: any) => f.primary).reduce((acc: any, f: any) => { acc[f.name] = editingRecord[f.name]; return acc; }, {}) }
                : processedValues;

            const response = await fetch(schema.endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const result = await response.json();
                if (editingRecord) {
                    setData(prev => prev.map(item => item === editingRecord ? { ...item, ...processedValues } : item));
                    message.success('Configuration updated');
                } else {
                    setData(prev => [...prev, result]);
                    message.success('Configuration created');
                }
                setMode('list');
            } else {
                const error = await response.json();
                message.error(`Save Failed: ${error.error || error.message || 'Unknown server error'}`);
            }
        } catch (error: any) {
            console.error("Save failed:", error);
            message.error(`Connection Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // -- Render Helpers --

    const downloadCSV = () => {
        if (!data || data.length === 0) return;

        const headers = schema.fields.map((f: any) => f.label).join(',');
        const rows = data.map((item: any) => {
            return schema.fields.map((f: any) => {
                const val = item[f.name];
                return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
            }).join(',');
        });

        const csvContent = [headers, ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${schema.title}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const columns = [
        ...schema.fields
            .filter((field: any) => !field.hidden)
            .map((field: any, index: number) => {
                // Generate filters dynamically from current data
                const uniqueValues = Array.from(new Set(data.map((item: any) => item[field.name]))).filter(Boolean);
                const filters = uniqueValues.map((val: any) => {
                    if (field.type === 'select' && field.options) {
                        const opt = field.options.find((o: any) => o.value === val);
                        return { text: opt ? opt.label : String(val), value: val };
                    }
                    return { text: String(val), value: val };
                });

                return {
                    title: field.label,
                    dataIndex: field.name,
                    key: field.name,
                    render: (text: any) => {
                        if (field.type === 'checkbox') return text ? 'Yes' : 'No';
                        if ((field.type === 'select' || field.type === 'multi-select') && field.options) {
                            if (Array.isArray(text)) {
                                return (
                                    <Space size={[0, 4]} wrap>
                                        {text.map((val: any) => {
                                            const opt = field.options?.find((o: any) => o.value === val);
                                            return <Tag color="blue" key={val}>{opt ? opt.label : val}</Tag>;
                                        })}
                                    </Space>
                                );
                            }
                            const opt = field.options.find((o: any) => o.value === text);
                            return opt ? opt.label : text;
                        }
                        return text;
                    },
                    sorter: {
                        compare: (a: any, b: any) => {
                            const valA = a[field.name];
                            const valB = b[field.name];
                            if (typeof valA === 'number' && typeof valB === 'number') return valA - valB;
                            return String(valA).localeCompare(String(valB));
                        },
                        multiple: index + 1
                    },
                    filters: filters.length > 0 ? filters : undefined,
                    onFilter: (value: any, record: any) => {
                        // Loose equality match for filtering
                        return record[field.name] == value;
                    }
                };
            }),
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            render: (_: any, record: any) => (
                <Space>
                    <Guard permission={permissions.update!}>
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                            style={{ color: brandingConfig.theme.primaryColor }}
                        />
                    </Guard>
                    <Guard permission={permissions.delete!}>
                        <Popconfirm title="Are you sure?" onConfirm={() => handleDelete(record)}>
                            <Button type="text" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Guard>
                </Space>
            )
        }
    ];

    if (mode === 'list') {
        const rowSelection = {
            selectedRowKeys,
            onChange: (newSelectedRowKeys: React.Key[]) => setSelectedRowKeys(newSelectedRowKeys),
        };

        return (
            <Card
                title={schema.title}
                extra={
                    <Space>
                        <Button icon={<Icons.DownloadOutlined />} onClick={downloadCSV}>
                            Export CSV
                        </Button>
                        {selectedRowKeys.length > 0 && (
                            <Guard permission={permissions.delete!}>
                                <Button danger onClick={handleBulkDelete}>
                                    Delete Selected ({selectedRowKeys.length})
                                </Button>
                            </Guard>
                        )}
                        <Guard permission={permissions.create!}>
                            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNew}>
                                Add New
                            </Button>
                        </Guard>
                    </Space>
                }
                style={{ background: brandingConfig.theme.componentBg, borderColor: '#333' }}
                headStyle={{ color: brandingConfig.theme.textColor, borderBottomColor: '#333' }}
                bodyStyle={{ padding: 0 }}
            >
                <Table
                    rowSelection={rowSelection}
                    columns={columns}
                    dataSource={data}
                    rowKey={(record) => record.id || record.imsirange_name || record.network_name || record.home_nw_mccmnc || Math.random().toString()}
                    pagination={{ pageSize: 10 }}
                    loading={loading}
                    style={{ background: 'transparent' }}
                />
            </Card>
        );
    }

    // Form Mode
    return (
        <Card
            title={
                <Space>
                    <Button icon={<LeftOutlined />} onClick={() => setMode('list')}>Back</Button>
                    <span>{editingRecord ? 'Edit Configuration' : 'New Configuration'}</span>
                </Space>
            }
            style={{ maxWidth: 800, margin: '0 auto', background: brandingConfig.theme.componentBg, borderColor: '#333' }}
            headStyle={{ color: brandingConfig.theme.textColor, borderBottomColor: '#333' }}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
            >
                {schema.fields.filter((f: any) => !f.hidden).map((field: any) => (
                    <Form.Item
                        key={field.name}
                        label={field.label}
                        name={field.name}
                        valuePropName={field.type === 'checkbox' ? 'checked' : undefined}
                        rules={[{ required: field.required, message: `${field.label} is required` }]}
                    >
                        {field.type === 'text' && <Input disabled={field.primary && !!editingRecord} />}
                        {field.type === 'email' && <Input type="email" disabled={field.primary && !!editingRecord} />}
                        {field.type === 'number' && <Input type="number" disabled={field.primary && !!editingRecord} />}
                        {field.type === 'select' && (
                            <Select disabled={field.primary && !!editingRecord}>
                                {field.options?.map((opt: any) => (
                                    <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                                ))}
                            </Select>
                        )}
                        {field.type === 'multi-select' && (
                            <Select mode="multiple" disabled={field.primary && !!editingRecord}>
                                {field.options?.map((opt: any) => (
                                    <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                                ))}
                            </Select>
                        )}
                        {field.type === 'checkbox' && <Checkbox disabled={field.primary && !!editingRecord} />}
                        {field.type === 'date' && <DatePicker style={{ width: '100%' }} disabled={field.primary && !!editingRecord} />}
                    </Form.Item>
                ))}
                <Form.Item>
                    <Space>
                        <Button type="primary" htmlType="submit">
                            Save
                        </Button>
                        <Button onClick={() => setMode('list')}>
                            Cancel
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Card>
    );
};
