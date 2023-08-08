// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) 2022-2023 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { Row, Col } from 'antd/lib/grid';
import Button from 'antd/lib/button';
import InputNumber from 'antd/lib/input-number';
import Radio, { RadioChangeEvent } from 'antd/lib/radio';
import Text from 'antd/lib/typography/Text';
import { RectDrawingMethod, CuboidDrawingMethod } from 'cvat-canvas-wrapper';

import { ShapeType } from 'reducers';
import { clamp } from 'utils/math';
import LabelSelector from 'components/label-selector/label-selector';
import CVATTooltip from 'components/common/cvat-tooltip';
import { Label, DimensionType } from 'cvat-core-wrapper';

interface Props {
    selectedLabelID: number | null;
    labels: any[];
    onChangeLabel(value: Label | null): void;
    onAdd(): void;
    jobInstance: any;
}

function AudioSelectorPopoverComponent(props: Props): JSX.Element {
    const {
        labels,
        selectedLabelID,
        onAdd,
        onChangeLabel,
    } = props;

    return (
        <div className='cvat-draw-shape-popover-content'>
            <Row justify='start'>
                <Col>
                    <Text className='cvat-text-color' strong>{`Add new audioselection`}</Text>
                </Col>
            </Row>
            <Row justify='start'>
                <Col>
                    <Text className='cvat-text-color'>Label</Text>
                </Col>
            </Row>
            <Row justify='center'>
                <Col span={24}>
                    <LabelSelector
                        isUnlabeled={selectedLabelID == null}
                        style={{ width: '100%' }}
                        labels={labels}
                        value={selectedLabelID}
                        onChange={onChangeLabel}
                    />
                </Col>
            </Row>
            <Row justify='space-around'>
                <Col span={12}>
                    <Button onClick={onAdd} disabled={selectedLabelID == null}>Add</Button>
                </Col>
            </Row>
        </div>
    );
}

export default React.memo(AudioSelectorPopoverComponent);
