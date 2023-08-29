import { Button, Modal, Select, Tabs } from 'antd';
import Text from 'antd/lib/typography/Text';
import React, { useState, useEffect, useCallback, useRef, useLayoutEffect, createRef } from 'react';
import { connect } from 'react-redux';
import { CombinedState } from 'reducers';
import { Col, Row } from 'antd/lib/grid';
import { ObjectState } from 'cvat-core-wrapper';
import { modalUpdateAsync, updateAnnotationsAsync } from 'actions/annotation-actions';
import getLabelDisplayName from 'utils/label-display';
import { PauseCircleFilled, PlayCircleFilled } from '@ant-design/icons';

interface Props {
};

const keyToLongQuestion = {
    race: 'What is their perceived race?',
    age: 'What is their perceived age?',
    sescar: 'What is the perceived socio-economic status as evidenced by their car make/model/condition?',
    sesclothing: 'What is the perceived socio-economic status as evidenced by their clothing?',
    gender: 'What is their perceived gender?',
    height: 'What is their perceived height?',
    bodytype: 'What is their perceived body type?',
    homelessness: 'Does CX exhibit any signs of homeless circumstances (eg the car is full of living material)?',
    foreignaccent: 'Does CX/POX have a non-American accent?',
    regionalaccent: 'Does CX/POX have a regional American accent?',
    lgbtq: 'Is CX/POX perceived to be a part of the LGBTQ community?',
    dui: 'Does CX/POX exhibit any signs of being under the influence of drugs or alcohol?',
    specialneeds: 'Does CX/POX exhibit any signs of special needs (e.g. physical disabilities, blindness, autism, etc. as defined in the special needs training)?'
};

interface StateToProps {
    visible: boolean;
    mode: string;
    states: any[],
    audioData: ArrayBuffer,
    frameSpeed: number,
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
                allStates,

            },
            player: {
                audio: {
                    data: audioData
                },
            },
        },
        settings: {
            player: {
                frameSpeed
            }
        }
    } = state;

    return {
        visible,
        audioData,
        frameSpeed,
        mode,
        states: allStates.filter(state => people.map(person => person.clientID).includes(state.clientID)),
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
    const {visible, mode, states, people, audioData, frameSpeed, onUpdateAnnotations, modalUpdate} = props;
    const [croppedImages, setCroppedImages] = useState<any[]>([]);
    const [images, setImages] = useState<HTMLImageElement[]>([]);
    const audio = createRef<HTMLAudioElement>();

    const [audioBlobURL, setAudioBlobURL] = useState<string>('');
    const [audioPlaying, setAudioPlaying] = useState(false);


    useEffect(() => {
        if (!visible) {
            images.forEach((image) => {
                if (image.src) {
                    URL.revokeObjectURL(image.src);
                }
            });
            setImages([]);

            if (audio.current) {
                audio.current.pause();
            }
            setAudioPlaying(false);
        } else {
            const images = states.map((_, idx) => {
                const img = new Image();
                return img;
            });
            setImages(images);
        }

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

    const onOK = () => modalUpdate({
        visible: false,
        people: [],
    });

    // clean-up
    useEffect(() => () => {
        images.forEach((image) => {
            if (image.src) {
                URL.revokeObjectURL(image.src);
            }
        });

        if (audioBlobURL) {
            URL.revokeObjectURL(audioBlobURL);
        }

        if (audio.current) {
            audio.current.pause();
        }
        setAudioPlaying(false);
    }, []);

    useEffect(() => {
        if(audioData) {
            const blb = new Blob([audioData], {type: 'audio/mp3'});
            setAudioBlobURL(URL.createObjectURL(blb));
        }
    }, [audioData])

    const playAudio = () => {
        if (audio.current) {
            if (!audioPlaying) {
                audio.current.load();
                audio.current.play();
                setAudioPlaying(true);
            }
            else {
                audio.current.pause();
                setAudioPlaying(false);
            }
        }
    }

    const frameToTimeString = (frame: number) => {
        let totalSeconds = frame / frameSpeed;
        const hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${hours}:${minutes}:${seconds}`;
    }

    return (
      <Modal visible={visible} width={'80%'} onOk={onOK} footer={[
        <Button
        onClick={onOK}
        disabled={
            mode === 'before_save' &&
                states.some(
                    (state) =>
                        Object.keys(state.attributes)
                            .some(attrId => state.attributes[attrId] === '')
                )
        }
        >
          Done
        </Button>,
      ]} >
            {
                mode === 'person_demographics' && (
                <>
                <h2>{getLabelDisplayName(states[0].label.name)} {states[0].attributes[states[0].label.attributes[0].id]}</h2>
                <Text>Please answer the following demographic questions for this person</Text>
                <hr/>
                <Row gutter={16}>
                    <Col span={18}>
                    {states[0].label.attributes
                    .filter((attr: any) => attr.name.startsWith('demographics.'))
                    .map((attr: any) => (

                        <div>
                            <div style={{margin:'25px 0 0 0'}}>
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
                                        states[0].attributes = {
                                            ...states[0].attributes,
                                            [attr.id]: val
                                        };
                                        onUpdateAnnotations([states[0]]);
                                    }}
                                    value={states[0].attributes[attr.id]}
                                    style={{width: '100%'}}
                                    />

                                }
                            </div>
                        </div>

                    ))}
                    </Col>
                    <Col span={6}>

                        {states[0].objectType === 'audioselection' && audioBlobURL && <>
                                <audio ref={audio} src={audioBlobURL + '#t='+frameToTimeString(states[0].frame)+','+frameToTimeString(states[0].frame + 200)}></audio>
                                <Button onClick={playAudio}>{!audioPlaying ? <PlayCircleFilled /> : <PauseCircleFilled />}</Button>
                        </>}


                        {
                            states[0].objectType === 'shape' && croppedImages[0] && <img  style={{maxWidth: '100%', maxHeight:'500px'}} src={croppedImages[0]}></img>
                        }

                    </Col>
                </Row></>
            )}

            {
                mode === 'before_save' && (
                    <Tabs
                        type='card'
                        tabBarStyle={{ marginBottom: '0px' }}
                    >
                        {states.map((state, idx) => (
                            <Tabs.TabPane
                            tab={(
                                <span>
                                    <Text>{getLabelDisplayName(state.label.name)} {state.attributes[state.label.attributes[0].id]}</Text>
                                </span>
                            )}
                            key={state.clientID}
                        >
                            <Row gutter={16}>
                                <Col span={18}>
                                {state.label.attributes
                                .filter((attr: any) => attr.name.startsWith('demographics.'))
                                .map((attr: any) => (

                                    <div>
                                        <div style={{margin:'25px 0 0 0'}}>
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
                                                    state.attributes = {
                                                        ...state.attributes,
                                                        [attr.id]: val
                                                    };
                                                    onUpdateAnnotations([states[idx]]);
                                                }}
                                                value={state.attributes[attr.id]}
                                                style={{width: '100%'}}
                                                />

                                            }
                                        </div>
                                    </div>

                                ))}
                                </Col>
                                <Col span={6}>
                                    {croppedImages[idx] && <img  style={{maxWidth: '100%', maxHeight:'500px'}} src={croppedImages[idx]}></img>}
                                </Col>
                            </Row>
                        </Tabs.TabPane>
                        ))}

                    </Tabs>
                )
            }
      </Modal>

    )
}

export default connect(mapStateToProps, mapDispatchToProps)(PersonQuestionModal);