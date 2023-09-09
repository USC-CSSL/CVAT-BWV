// Copyright (C) 2020-2022 Intel Corporation
// Copyright (C) 2022 CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { withRouter, RouteComponentProps } from 'react-router';
import { connect } from 'react-redux';
// eslint-disable-next-line import/no-extraneous-dependencies
import { MenuInfo } from 'rc-menu/lib/interface';

import { CombinedState, JobStage } from 'reducers';
import AnnotationMenuComponent, { Actions } from 'components/annotation-page/top-bar/annotation-menu';
import { updateJobAsync } from 'actions/tasks-actions';
import {
    saveAnnotationsAsync,
    setForceExitAnnotationFlag as setForceExitAnnotationFlagAction,
    removeAnnotationsAsync as removeAnnotationsAsyncAction,
    modalUpdateAsync,
} from 'actions/annotation-actions';
import { exportActions } from 'actions/export-actions';
import { importActions } from 'actions/import-actions';
import { getCore } from 'cvat-core-wrapper';

const core = getCore();

interface StateToProps {
    jobInstance: any;
    stopFrame: number;
    objectStates: any[];
    isOrganizationOwner: boolean;
}

interface DispatchToProps {
    showExportModal: (jobInstance: any) => void;
    showImportModal: (jobInstance: any) => void;
    removeAnnotations(startnumber: number, endnumber: number, delTrackKeyframesOnly: boolean): void;
    setForceExitAnnotationFlag(forceExit: boolean): void;
    saveAnnotations(jobInstance: any, afterSave?: () => void): void;
    updateJob(jobInstance: any): void;
    showBeforeSubmitModal(phase: string, people: any[]): void;
}

function mapStateToProps(state: CombinedState): StateToProps {
    const {
        annotation: {
            job: {
                instance: jobInstance,
                instance: { stopFrame },
            },
            annotations: {
                allStates
            }
        },
        auth: {
            user,
        },
        organizations: {
            current: currentOrganization,
        }
    } = state;

    return {
        jobInstance,
        stopFrame,
        objectStates: allStates,
        isOrganizationOwner: currentOrganization?.owner.username === user.username
    };
}

function mapDispatchToProps(dispatch: any): DispatchToProps {
    return {
        showExportModal(jobInstance: any): void {
            dispatch(exportActions.openExportDatasetModal(jobInstance));
        },
        showImportModal(jobInstance: any): void {
            dispatch(importActions.openImportDatasetModal(jobInstance));
        },
        removeAnnotations(startnumber: number, endnumber: number, delTrackKeyframesOnly:boolean) {
            dispatch(removeAnnotationsAsyncAction(startnumber, endnumber, delTrackKeyframesOnly));
        },
        setForceExitAnnotationFlag(forceExit: boolean): void {
            dispatch(setForceExitAnnotationFlagAction(forceExit));
        },
        saveAnnotations(jobInstance: any, afterSave?: () => void): void {
            dispatch(saveAnnotationsAsync(jobInstance, false, afterSave));
        },
        updateJob(jobInstance: any): void {
            dispatch(updateJobAsync(jobInstance));
        },
        showBeforeSubmitModal(phase: string, people: any[]): void {

            if (phase === core.enums.Phase.PHASE1A) {
                dispatch(modalUpdateAsync({
                    people,
                    visible: true,
                    mode: 'face_selection',
                }))
            } else {
                dispatch(modalUpdateAsync({
                    people,
                    visible: true,
                    mode: 'before_save',
                }))
            }

        }
    };
}

type Props = StateToProps & DispatchToProps & RouteComponentProps;

function AnnotationMenuContainer(props: Props): JSX.Element {
    const {
        jobInstance,
        stopFrame,
        history,
        showExportModal,
        showImportModal,
        removeAnnotations,
        setForceExitAnnotationFlag,
        saveAnnotations,
        updateJob,
        isOrganizationOwner,
        objectStates,
        showBeforeSubmitModal
    } = props;

    const onClickMenu = (params: MenuInfo): void => {
        const [action] = params.keyPath;
        if (action === Actions.EXPORT_JOB_DATASET) {
            showExportModal(jobInstance);
        } else if (action === Actions.RENEW_JOB) {
            jobInstance.state = core.enums.JobState.NEW;
            jobInstance.stage = JobStage.ANNOTATION;
            updateJob(jobInstance);
            window.location.reload();
        } else if (action === Actions.FINISH_JOB) {
            // jobInstance.stage = JobStage.ACCEPTANCE;
            // jobInstance.state = core.enums.JobState.COMPLETED;
            // updateJob(jobInstance);

            if (jobInstance.phase === core.enums.Phase.PHASE1A) {
                // jobInstance.stage = JobStage.ACCEPTANCE;
                // jobInstance.state = core.enums.JobState.COMPLETED;
                const people = objectStates.filter(state => {
                    if (state.label.name.startsWith('person:') && state.objectType === 'shape') {
                        return true;
                    }
                    return false;
                }).map((person => ({
                    clientID: person.clientID,
                    frameNumber: person.frame
                })));
                showBeforeSubmitModal(core.enums.Phase.PHASE1A, people);
                // jobInstance.phase = core.enums.Phase.PHASE1B;
                // updateJob(jobInstance);
            }
            else if (jobInstance.phase === core.enums.Phase.PHASE1B) {
                const people = objectStates.filter(state => {
                    if (state.label.name.startsWith('person:')) {
                        return true;
                    }
                    return false;
                }).map((person => ({
                    clientID: person.clientID,
                    frameNumber: person.frame
                })));
                showBeforeSubmitModal(core.enums.Phase.PHASE1B, people);
            }


            // history.push(`/tasks/${jobInstance.taskId}`);
        } else if (action === Actions.OPEN_TASK) {
            history.push(`/tasks/${jobInstance.taskId}`);
        } else if (action.startsWith('state:')) {
            [, jobInstance.state] = action.split(':');
            updateJob(jobInstance);
            window.location.reload();
        } else if (action === Actions.LOAD_JOB_ANNO) {
            showImportModal(jobInstance);
        }
    };

    return (
        <AnnotationMenuComponent
            taskMode={jobInstance.mode}
            onClickMenu={onClickMenu}
            removeAnnotations={removeAnnotations}
            setForceExitAnnotationFlag={setForceExitAnnotationFlag}
            saveAnnotations={saveAnnotations}
            jobInstance={jobInstance}
            stopFrame={stopFrame}
            isOrganizationOwner={isOrganizationOwner}
        />
    );
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AnnotationMenuContainer));
