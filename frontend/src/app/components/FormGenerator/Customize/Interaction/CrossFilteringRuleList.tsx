/**
 * Datart
 *
 * Copyright 2021
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Button, Dropdown, Select, Space, Table } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import ChartDataView from 'app/types/ChartDataView';
import { FC, useMemo } from 'react';
import { uuidv4 } from 'utils/utils';
import { InteractionFieldRelation } from '../../constants';
import RelationList from './RelationList';
import { CrossFilteringInteractionRule, I18nTranslator } from './types';

const CrossFilteringRuleList: FC<
  {
    widgetId: string;
    rules?: CrossFilteringInteractionRule[];
    boardVizs?: Array<{
      id: string;
      datachartId: string;
      config: { name: string; type: string };
    }>;
    dataview?: ChartDataView;
    onRuleChange: (id, prop, value) => void;
    onSelectedRules: (rules: CrossFilteringInteractionRule[]) => void;
  } & I18nTranslator
> = ({
  widgetId,
  rules,
  boardVizs,
  dataview,
  onRuleChange,
  onSelectedRules,
  translate: t,
}) => {
  const currentRules = useMemo(() => {
    return (boardVizs || [])
      .filter(bvz => bvz?.config?.type === 'chart' && bvz?.id !== widgetId)
      .map(bvz => {
        const enableRule = rules?.find(r => r.relId === bvz.datachartId);
        if (enableRule) {
          return enableRule;
        }
        return {
          id: uuidv4(),
          enable: false,
          relId: bvz.datachartId,
          relName: bvz?.config?.name,
          relation: InteractionFieldRelation.Auto,
        };
      });
  }, [boardVizs, rules]);
  const selectedRuleKeys = useMemo(
    () => currentRules?.filter(r => r.enable)?.map(r => r.id),
    [currentRules],
  );
  const columns: ColumnsType<CrossFilteringInteractionRule> = useMemo(
    () => [
      {
        title: t('crossFiltering.rule.header.relId'),
        dataIndex: 'relName',
        key: 'relName',
      },
      {
        title: t('crossFiltering.rule.header.relation'),
        dataIndex: 'relation',
        key: 'relation',
        render: (_, record) => {
          return (
            <Space>
              <Select
                disabled={!rules?.map(r => r.id).includes(record?.id)}
                value={record?.relation}
                placeholder={t('drillThrough.rule.relation.title')}
                onChange={relation =>
                  onRuleChange(record?.id, 'relation', relation)
                }
              >
                <Select.Option value={InteractionFieldRelation.Auto}>
                  {t('drillThrough.rule.relation.auto')}
                </Select.Option>
                <Select.Option value={InteractionFieldRelation.Customize}>
                  {t('drillThrough.rule.relation.customize')}
                </Select.Option>
              </Select>
              <Dropdown
                destroyPopupOnHide
                overlayStyle={{ margin: 4 }}
                disabled={
                  record?.relation !== InteractionFieldRelation.Customize ||
                  !rules?.map(r => r.id).includes(record?.id)
                }
                overlay={() => (
                  <RelationList
                    translate={t}
                    targetRelId={record?.relId}
                    sourceFields={
                      dataview?.meta?.concat(dataview?.computedFields || []) ||
                      []
                    }
                    sourceVariables={dataview?.variables || []}
                    relations={record?.[InteractionFieldRelation.Customize]}
                    onRelationChange={newRelations => {
                      onRuleChange(
                        record?.id,
                        InteractionFieldRelation.Customize,
                        newRelations,
                      );
                    }}
                  />
                )}
                placement="bottomLeft"
                trigger={['click']}
                arrow
              >
                <Button type="link">
                  {t('drillThrough.rule.relation.setting')}
                </Button>
              </Dropdown>
            </Space>
          );
        },
      },
    ],
    [rules, dataview, onRuleChange, t],
  );

  return (
    <Table
      rowSelection={{
        type: 'checkbox',
        selectedRowKeys: selectedRuleKeys,
        onChange: selectedKeys => {
          const enableRules = (rules || []).filter(r =>
            selectedKeys.includes(r.id),
          );
          const newRules = (currentRules || [])
            .filter(r => selectedKeys.includes(r.id))
            .filter(r => !enableRules?.map(or => or.id).includes(r.id))
            .map(r => {
              r.enable = true;
              return r;
            });
          const finalNewRules = enableRules.concat(newRules);
          onSelectedRules(finalNewRules);
        },
      }}
      style={{ height: 400, overflow: 'auto' }}
      rowKey="id"
      columns={columns}
      dataSource={currentRules}
      pagination={{ hideOnSinglePage: true, pageSize: 5 }}
    />
  );
};

export default CrossFilteringRuleList;
