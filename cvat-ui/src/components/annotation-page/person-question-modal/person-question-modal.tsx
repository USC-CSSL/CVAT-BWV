import { Modal, Select } from 'antd';
import Text from 'antd/lib/typography/Text';
import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { connect } from 'react-redux';
import { CombinedState } from 'reducers';
import { Col, Row } from 'antd/lib/grid';
import { ObjectState } from 'cvat-core-wrapper';
import { modalUpdateAsync, updateAnnotationsAsync } from 'actions/annotation-actions';

interface Props {
};

const keyToLongQuestion = {
    race: 'What is their perceived race?',
    age: 'What is their perceived age?',
};

interface StateToProps {
    visible: boolean;
    mode: string;
    states: any[],
    people: {
        clientID: number;
        frameImage: any
    }[]
}

function mapStateToProps(state: CombinedState): StateToProps {
    const {
        annotation: {
            modal: {
                visible,
                mode,
                people
            },
            annotations: {
                states
            }
        },
    } = state;

    return {
        visible,
        mode,
        states: states.filter(state => people.map(person => person.clientID).includes(state.clientID)),
        people,
    };
}


interface DispatchToProps {
    onUpdateAnnotations(states: ObjectState[]): void;
    modalUpdate(update: any): void;
}

function mapDispatchToProps(dispatch: any): DispatchToProps {
    return {
        onUpdateAnnotations(states: ObjectState[]): void {
            dispatch(updateAnnotationsAsync(states));
        },
        modalUpdate(update: any): void {
            dispatch(modalUpdateAsync(update));
        }
    };
}


function PersonQuestionModal(props: Props & StateToProps & DispatchToProps) {
    const {visible, mode, states, people, onUpdateAnnotations, modalUpdate} = props;
    const [croppedImages, setCroppedImages] = useState<any[]>([]);
    const [images, setImages] = useState<HTMLImageElement[]>([]);


    useEffect(() => {
        if (!visible) {
            images.forEach((image) => {
                if (image.src) {
                    URL.revokeObjectURL(image.src);
                }
            });
            setImages([]);
        } else {
            const images = states.map((_, idx) => {
                const img = new Image();
                return img;
            })
            setImages(images);
        }
        // const cvs = states.map((state) => {
        // const CVS = document.createElement('canvas');
        // const CTX = CVS.getContext("2d");
        // console.log(state.points)
        // CTX?.drawImage(idToImageMap[state.clientID].imageData, 0, 0);
        // return CVS;

        // });
        // setCnvs(cvs);
    }, [visible]);

    useEffect(() => {
        if (!images.length) {
            setCroppedImages([]);
        } else {
            Promise.all(images.map(async (image, idx) => {
                const cnv = document.createElement('canvas');
                const ctx = cnv.getContext('2d');

                const p1X = Math.min(states[idx].points[0], states[idx].points[2]);
                const p2X = Math.max(states[idx].points[0], states[idx].points[2]);

                const p1Y = Math.min(states[idx].points[1], states[idx].points[3]);
                const p2Y = Math.max(states[idx].points[1], states[idx].points[3]);

                const sX = p1X,
                    sY = p1Y,
                    sW = p2X - p1X,
                    sH = p2Y - p1Y;

                cnv.width = sW;
                cnv.height = sH;
                return await (new Promise((resolve) => {
                    image.onload = () => {
                        ctx?.drawImage(image, sX, sY, sW, sH, 0, 0, sW, sH);
                        const cropped = cnv.toDataURL();
                        cnv.remove();
                        resolve(cropped);
                    };
                    image.src = URL.createObjectURL(people[idx].frameImage);
                }));
            })).then(imgs => setCroppedImages(imgs));

        }
    }, [images]);

    // clean-up
    useEffect(() => () => {
        images.forEach((image) => {
            if (image.src) {
                URL.revokeObjectURL(image.src);
            }
        });
    }, []);

    return (
      <Modal visible={visible} onOk={() => modalUpdate({
        visible: false,
        people: [],
      })} >
            {
                mode === 'person_demographics' && (
                <Row>
                    <Col span={18}>
                    {states[0].label.attributes
                    .filter((attr: any) => attr.name.startsWith('demographics.'))
                    .map((attr: any) => (

                        <div>
                            <div>
                                <Text>{keyToLongQuestion[attr.name.split('demographics.')[1]]}</Text>
                            </div>
                            <div>
                                {
                                    attr.inputType === 'select' &&

                                    <Select
                                    options={
                                        attr.values.map(((val: string) => ({
                                            label: val,
                                            value: val
                                        })))
                                    }
                                    onChange={(val) => {
                                        states[0].attributes[attr.id] = val;
                                        onUpdateAnnotations([states[0]]);
                                    }}
                                    style={{width: '100%'}}
                                    />

                                }
                            </div>
                        </div>

                    ))}
                    </Col>
                    <Col span={6}>
                        {croppedImages[0] && <img  style={{width: '100%'}} src={croppedImages[0]}></img>}
                    </Col>
                </Row>
            )}
      </Modal>

    )
}

export default connect(mapStateToProps, mapDispatchToProps)(PersonQuestionModal);