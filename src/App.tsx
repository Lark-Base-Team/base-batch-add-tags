import React from 'react';
import './App.css';
import { bitable, ITableMeta, IFieldMeta, FieldType, IMultiSelectField, IOpenMultiSelect, IMultiSelectFieldMeta } from "@lark-base-open/js-sdk";
import { Button, Form } from '@douyinfe/semi-ui';
import { BaseFormApi } from '@douyinfe/semi-foundation/lib/es/form/interface';
import { useState, useEffect, useRef, useCallback } from 'react';
import { asyncForEach, getMultiSelectOptions } from './utils';
import { useTranslation } from 'react-i18next';


export default function App() {
  const { t } = useTranslation();
  const [tableMetaList, setTableMetaList] = useState<ITableMeta[]>();
  const [fields, setFields] = useState<IFieldMeta[]>();
  const [multiSelect, setMultiSelect] = useState<{
    id: string;
    name: string;
  }[]>();
  const formApi = useRef<BaseFormApi>();


  const handleAddTag = useCallback(async (values: {
    table: string;
    fields: string[];
    condition: 'equal' | 'include',
    keyword: string;
    tags: string[];
    target: string;
  }) => {
    const { table: tableId, fields, keyword, tags, condition, target } = values;
    if (tableId) {
      const table = await bitable.base.getTableById(tableId);
      if (!table) {
        return;
      }
      let targetFieldId = target;
      if (target === 'add_new') {
        targetFieldId = await table.addField({
          type: FieldType.MultiSelect,
          name: `${t('label')}${String(Date.now()).slice(-4)}`,
        });
      }
      const targetField = await table.getFieldById(targetFieldId) as unknown as IMultiSelectField;
      const { records } = await table.getRecords({
        pageSize: 5000,
      });
      await asyncForEach(records, async (record) => {
        // 遍历条件
        const fn = condition === 'equal' ? (a: string, b: string) => a === b : (a: string, b: string) => a.includes(b);
        for (const field of fields) {
          const value = record.fields[field]?.[0].text;
          if (typeof value=== 'string') {
            if (fn(value, keyword)) {
              // 满足条件
              const targetValue: IOpenMultiSelect = record.fields[targetFieldId] || [];
              const uniqueId = new Set(targetValue.map(value => value.id));
              const tagToAdd = await getMultiSelectOptions(targetField, tags);
              tagToAdd.forEach((opt) => {
                if (!uniqueId.has(opt.id)) {
                  targetValue.push({
                    id: opt.id,
                    text: opt.name,
                  });
                  uniqueId.add(opt.id);
                }
              })
              record.fields[targetFieldId] = targetValue;
              break;
            }
          }
        }
      });
      table.setRecords(records);
    }
  }, []);
  useEffect(() => {
    Promise.all([bitable.base.getTableMetaList(), bitable.base.getSelection()])
      .then(([metaList, selection]) => {
        setTableMetaList(metaList);
        formApi.current?.setValues({ table: selection.tableId, view: selection.viewId });
        refreshFieldList(selection.tableId || '');
      });
  }, []);

  const refreshFieldList = useCallback(async (tableId: string) => {
    const table = await bitable.base.getTableById(tableId);
    if (table) {
      const fieldList = await table.getFieldMetaList();
      const textFields = fieldList.filter(f => f.type === FieldType.Text);
      const multiSelectFields: {
        id: string;
        name: string;
      }[] = fieldList.filter(f => f.type === FieldType.MultiSelect) as IMultiSelectFieldMeta[];
      multiSelectFields.push({
        id: 'add_new',
        name: t('add_new_field'),
      });
      setMultiSelect(multiSelectFields);
      setFields(textFields);
    }
  }, []);

  return (
    <main className="main">
      <Form labelPosition='top' onSubmit={handleAddTag} getFormApi={(baseFormApi: BaseFormApi) => formApi.current = baseFormApi}>
        <Form.Select
          field='table'
          label={{ text: t('select_table'), required: true }}
          rules={[
            { required: true, message: t('select_table_placeholder') },
          ]}
          trigger='blur'
          placeholder={t('select_table_placeholder')}
          style={{ width: '100%' }}
          onChange={(tableId) => { refreshFieldList(String(tableId)) }}  
        >
          {
            Array.isArray(tableMetaList) && tableMetaList.map(({ name, id }) => {
              return (
                <Form.Select.Option key={id} value={id}>
                  {name}
                </Form.Select.Option>
              );
            })
          }
        </Form.Select>
        <Form.Select
          multiple
          label={{ text: t('select_field'), required: true }}
          rules={[
            { required: true, message: t('selct_field_placeholder') },
          ]}
          trigger='blur'
          field='fields'
          placeholder={t("selct_field_placeholder")}
          style={{ width: '100%' }}
        >
          {
            Array.isArray(fields) && fields.map(({ name, id }) => {
              return (
                <Form.Select.Option key={id} value={id}>
                  {name}
                </Form.Select.Option>
              );
            })
          }
        </Form.Select>
        <Form.Select
          label={{ text: t('match_funtion'), required: true }}
          field='condition'
          rules={[
            { required: true, message: t('match_funtion_placeholder') },
          ]}
          trigger='blur'
          initValue={'include'}
          placeholder={t('match_funtion_placeholder')}
        >
          <Form.Select.Option key="include" value='include'>{t('include_function')}</Form.Select.Option>
          <Form.Select.Option key="equal" value='equal'>{t('equal_function')}</Form.Select.Option>
        </Form.Select>
        <Form.Input field='keyword'
          label={{ text: t('keyword'), required: true }}
          rules={[
            { required: true, message: t('keyword_placeholder') },
          ]}
          placeholder={t('keyword_placeholder')}
          trigger='blur'
        />
        <Form.Select
          field='target'
          label={{ text: t('target_field') }}
          rules={[
            { required: true, message: t('target_field_placeholder')},
          ]}
          placeholder={t('target_field_placeholder')}
          trigger='blur'
        >
          {
            Array.isArray(multiSelect) && multiSelect.map(({ name, id }) => {
              return (
                <Form.Select.Option key={id} value={id}>
                  {name}
                </Form.Select.Option>
              );
            })
          }
        </Form.Select>
        <Form.TagInput
          field='tags'
          label={{ text: t('add_tag'), required: true }}
          placeholder={t('add_tag_placeholder')}
          rules={[
            { required: true, message: t('add_tag_placeholder')},
          ]}
          trigger='blur'
        />
        <Button theme='solid' htmlType='submit'>{t('submit_button')}</Button>
      </Form>
    </main>
  )
}