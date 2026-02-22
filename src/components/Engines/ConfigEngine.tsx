"use client";
import React, { useState } from 'react';
import { Form, Input, Button, Select, Checkbox, DatePicker, Table, Space, Popconfirm, message, Card, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, LeftOutlined } from '@ant-design/icons';
import * as Icons from '@ant-design/icons';
import { brandingConfig } from '@/branding.config';
import dayjs from 'dayjs';
import { Guard } from '@/components/Access/Guard';

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

export const ConfigEngine = ({ schema, initialData = [] }: { schema: ConfigSchema, initialData?: any[] }) => {
    const permissions = schema.permissions || {
        create: 'node:create',
        update: 'node:update',
        delete: 'node:delete'
    };

    // Mode state: 'list' or 'form'
    const [mode, setMode] = useState<'list' | 'form'>('list');

    // Data state for the list view
    const [data, setData] = useState<any[]>(initialData.length > 0 ? initialData : [
        { id: '1', nodeName: 'Node-Alpha', ipAddress: '192.168.1.10', nodeType: 'router', isActive: true, deploymentDate: '2023-01-15' },
        { id: '2', nodeName: 'Switch-Beta', ipAddress: '192.168.1.20', nodeType: 'switch', isActive: true, deploymentDate: '2023-02-20' },
    ]);

    // Selection state for bulk delete
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    // Editing state
    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [form] = Form.useForm();

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
        schema.fields.forEach(field => {
            if (field.type === 'date' && formValues[field.name]) {
                formValues[field.name] = dayjs(formValues[field.name]);
            }
        });

        form.setFieldsValue(formValues);
        setMode('form');
    };

    const handleDelete = (id: string) => {
        setData(prev => prev.filter(item => item.id !== id));
        message.success('Configuration deleted');
    };

    const handleBulkDelete = () => {
        setData(prev => prev.filter(item => !selectedRowKeys.includes(item.id)));
        setSelectedRowKeys([]);
        message.success(`${selectedRowKeys.length} configurations deleted`);
    };

    const onFinish = (values: any) => {
        const processedValues = { ...values };

        // Generic date transformation based on schema
        schema.fields.forEach(field => {
            if (field.type === 'date' && processedValues[field.name]) {
                processedValues[field.name] = processedValues[field.name].format('YYYY-MM-DD');
            }
        });

        if (editingRecord) {
            // Update existing
            setData(prev => prev.map(item => item.id === editingRecord.id ? { ...item, ...processedValues } : item));
            message.success('Configuration updated');
        } else {
            // Create new
            const newRecord = { ...processedValues, id: Date.now().toString() };
            setData(prev => [...prev, newRecord]);
            message.success('Configuration created');
        }
        setMode('list');
    };

    // -- Render Helpers --

    const downloadCSV = () => {
        if (!data || data.length === 0) return;

        const headers = schema.fields.map(f => f.label).join(',');
        const rows = data.map(item => {
            return schema.fields.map(f => {
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
            .map((field, index) => {
                // Generate filters dynamically from current data
                const uniqueValues = Array.from(new Set(data.map(item => item[field.name]))).filter(Boolean);
                const filters = uniqueValues.map(val => {
                    if (field.type === 'select' && field.options) {
                        const opt = field.options.find(o => o.value === val);
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
                                        {text.map(val => {
                                            const opt = field.options?.find(o => o.value === val);
                                            return <Tag color="blue" key={val}>{opt ? opt.label : val}</Tag>;
                                        })}
                                    </Space>
                                );
                            }
                            const opt = field.options.find(o => o.value === text);
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
                        <Popconfirm title="Are you sure?" onConfirm={() => handleDelete(record.id)}>
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
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
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
                {schema.fields.map((field) => (
                    <Form.Item
                        key={field.name}
                        label={field.label}
                        name={field.name}
                        valuePropName={field.type === 'checkbox' ? 'checked' : undefined}
                        rules={[{ required: field.required, message: `${field.label} is required` }]}
                    >
                        {field.type === 'text' && <Input />}
                        {field.type === 'email' && <Input type="email" />}
                        {field.type === 'number' && <Input type="number" />}
                        {field.type === 'select' && (
                            <Select>
                                {field.options?.map(opt => (
                                    <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                                ))}
                            </Select>
                        )}
                        {field.type === 'multi-select' && (
                            <Select mode="multiple">
                                {field.options?.map(opt => (
                                    <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                                ))}
                            </Select>
                        )}
                        {field.type === 'checkbox' && <Checkbox />}
                        {field.type === 'date' && <DatePicker style={{ width: '100%' }} />}
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
