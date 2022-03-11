import { Callout, DefaultButton, TextField, ColorPicker, ComboBox, IComboBoxOption, IComboBox, Label, Slider, IColor, Dropdown, IDropdownOption, Stack, Separator, ChoiceGroup, IChoiceGroupOption, Checkbox } from "@fluentui/react";
import { Model, TabNode } from "flexlayout-react";
import React, { Dispatch, FormEvent, MouseEvent, MouseEventHandler, useEffect, useState } from "react";
import { toNumber } from "lodash";
import './RightPanel.scss';
import { Delete16Regular } from '@fluentui/react-icons';
import { ChromatinRepresentation } from "../../modules/graphics";
import { Text } from '@fluentui/react/lib/Text';

import { ChromatinViewportConfiguration, ConfigurationAction, ConfigurationState, ViewportConfigurationType } from '../../modules/storage/models/viewports';
import { BinPositionsData, Data, DataAction, DataID, DataState, isoDataID } from "../../modules/storage/models/data";
import { SelectionAction, SelectionState } from "../../modules/storage/models/selections";
import { useConfiguration, useSelections, useViewportName } from "../hooks";
import { SelectionsPart } from "./SelectionsPart";

export function ChromatinViewportConfigurationPanel(props: {
    model: Model,
    node: TabNode,
    configurationsReducer: [ConfigurationState, Dispatch<ConfigurationAction>],
    dataReducer: [DataState, Dispatch<DataAction>],
    selectionsReducer: [SelectionState, Dispatch<SelectionAction>],
}): JSX.Element {
    const configurationReducer = useConfiguration<ChromatinViewportConfiguration>(props.node.getConfig(), props.configurationsReducer);

    const [data, dataDispatch] = props.dataReducer;
    const [configuration, updateConfiguration] = configurationReducer;

    const [viewportName, setViewportName] = useViewportName(props.node, props.configurationsReducer);

    const data3DOptions = data.data
        .filter(d => d.type == '3d-positions')
        // .filter(d => configuration.data ? !viewportDataIDs.includes(configuration.data.id) : true)
        .map(d => {
            return {
                key: isoDataID.unwrap(d.id),
                id: isoDataID.unwrap(d.id).toString(),
                text: d.name,
            } as IComboBoxOption;
        });
    const data1DOptions = data.data
        .filter(d => d.type == '3d-positions')
        .map(d => {
            return {
                key: isoDataID.unwrap(d.id),
                id: isoDataID.unwrap(d.id).toString(),
                text: d.name,
            } as IComboBoxOption;
        });

    const otherData1DOptions = data.data
        .filter(d => d.type == "sparse-1d-data-text" || d.type == "sparse-1d-data-numerical")
        .map(d => {
            return {
                key: isoDataID.unwrap(d.id),
                id: isoDataID.unwrap(d.id).toString(),
                text: d.name,
            }
        })



    const [isCalloutVisible, setIsCalloutVisible] = useState<boolean>(false);

    const selections = useSelections(0, [configuration, updateConfiguration], props.dataReducer, props.selectionsReducer);

    //#region Viewport Settings
    const setBackgroundColor = (event: React.SyntheticEvent<HTMLElement>, color: IColor): void => {
        if (!configuration) return;

        updateConfiguration({
            ...configuration,
            backgroundColor: color
        })

    };

    const setSSAORadius = (radius: number) => {
        if (!configuration) return;

        updateConfiguration({
            ...configuration,
            ssao: {
                ...configuration.ssao,
                radius: toNumber(radius)
            }
        });
    }
    //#endregion

    //#region Data Parts
    // const removeData3D = (index: number) => {
    //     if (!configuration) return;

    //     const newData = [...configuration.data];
    //     newData.splice(index, 1);

    //     updateConfiguration({
    //         ...configuration,
    //         selectedDataIndex: configuration.selectedDataIndex == index ? null : configuration.selectedDataIndex,
    //         data: newData,
    //     });
    // };

    const setData3D = (event: React.FormEvent<IComboBox>, option?: IComboBoxOption) => {
        if (!configuration || !option) return;

        const selectedDataId: DataID = isoDataID.wrap(option.key as number);
        const selectedData = data.data.filter(d => d.id == selectedDataId)[0] as BinPositionsData;

        updateConfiguration({
            ...configuration,
            data: {
                ...configuration.data,

                id: selectedDataId,

                representation: ChromatinRepresentation.ContinuousTube,
                radius: 0.01,

                selections: [],
            },
            chromosomes: new Array(selectedData.chromosomes.length).fill(true),
            mapValues: {
                id: -1,
            }
        });
    };

    const setData1D = (event: React.FormEvent<IComboBox>, option?: IComboBoxOption) => {
        if (option) {
            const selectedDataId: number = option.key as number;

            updateConfiguration({
                ...configuration,
                mapValues: {
                    ...configuration.mapValues,
                    id: selectedDataId,
                },
            });
        }
    };

    const setOtherData1D = (event: React.FormEvent<IComboBox>, option?: IComboBoxOption) => {

        const selected = option?.selected;
        if (option) {
            updateConfiguration({
                ...configuration,
                otherMapValues: selected
                    ? [...configuration.otherMapValues, isoDataID.wrap(Number(option!.key))]
                    : configuration.otherMapValues.filter(id => id != isoDataID.wrap(Number(option!.key)))
            });
        }
    }

    const setRadius = (radius: number) => {
        if (!configuration.data) return;

        updateConfiguration({
            ...configuration,
            data: {
                ...configuration.data,
                radius
            }
        });
    }
    //#endregion

    const setCutawayAxis = (ev?: FormEvent<HTMLElement | HTMLInputElement> | undefined, option?: IChoiceGroupOption | undefined) => {
        if (!option) return;

        const key = option.key;

        if (key != 'X' && key != 'Y' && key != 'Z') return;

        updateConfiguration({
            ...configuration,
            cutaway: {
                ...configuration.cutaway,
                axis: key
            }
        });
    }

    const setCutawayLength = (length: number) => {
        updateConfiguration({
            ...configuration,
            cutaway: {
                ...configuration.cutaway,
                length: length
            }
        });
    }

    const handleChromosomeMouseEvent = (event: MouseEvent<HTMLDivElement>, index: number) => {
        if (event.buttons != 1) {
            return;
        }

        const newChromosomes = [...configuration.chromosomes];
        newChromosomes[index] = !newChromosomes[index];
        updateConfiguration({
            ...configuration,
            chromosomes: newChromosomes
        });
    }

    if (configuration == null || configuration == undefined || configuration.type != ViewportConfigurationType.Chromatin) {
        return <div></div>;
    }

    return <div className="section">
        <TextField label="Name" value={viewportName} onChange={(e, v) => setViewportName(v)} />


        <Text nowrap block variant='large' style={{ marginTop: '16px', }}>Visual Options</Text>
        <Stack tokens={{ childrenGap: '8px' }}>
            <Label>Background: </Label>
            <DefaultButton id="backgroundButton"
                text={String('#' + configuration.backgroundColor.hex)}
                onClick={() => setIsCalloutVisible(true)}
            />
            {isCalloutVisible && (
                <Callout
                    gapSpace={0}
                    target={'#backgroundButton'}
                    onDismiss={() => setIsCalloutVisible(false)}
                    setInitialFocus
                >
                    <ColorPicker
                        color={configuration.backgroundColor}
                        onChange={setBackgroundColor}
                        alphaType={'none'}
                        showPreview={true}
                        strings={{
                            hueAriaLabel: 'Hue',
                        }}
                    />
                </Callout>
            )}
            {/* <Slider label="SSAO Radius" min={0.0} max={1.0} step={0.01} value={configuration.ssao.radius} showValue onChange={setSSAORadius} /> */}
        </Stack>

        {/* List of 3D data */}
        <div style={{ display: 'block', width: '100%', marginTop: '16px' }}></div>
        <Separator></Separator>
        <Text nowrap block variant='large'>3D Data</Text>

        <ComboBox
            label=""
            allowFreeform={false}
            autoComplete={'on'}
            options={data3DOptions}
            onChange={setData3D}
            onItemClick={setData3D}
            selectedKey={configuration.data ? isoDataID.unwrap(configuration.data.id) : null}
            style={{ marginTop: '8px', padding: '4px' }}
            shouldRestoreFocus={false}
        />

        {configuration.data != null && configuration.chromosomes.length != 0 && (
            <Stack styles={{ root: { padding: 4 } }}>
                {configuration.chromosomes.map((v, i) => {
                    return <div
                        style={{ width: "max-content" }}
                        draggable={false}
                        key={i}
                        onMouseDown={(e) => handleChromosomeMouseEvent(e, i)}
                        onMouseEnter={(e) => handleChromosomeMouseEvent(e, i)}>
                        <Checkbox
                            label={"Chromosome " + i.toString()}
                            checked={v}
                        />
                    </div>

                })}
            </Stack>
        )
        }

        {/* 3D DATA REPRESENTATION */}
        <div style={{ display: 'block', width: '100%', marginTop: '16px' }}></div>
        <Separator></Separator>
        <Text nowrap block variant='large' style={{ marginBottom: '5px' }}>3D Data Visualization</Text>
        <Stack tokens={{ childrenGap: '8px' }}>
            {configuration.data && (<Slider
                label="Radius"
                min={configuration.radiusRange.min}
                max={configuration.radiusRange.max}
                step={(configuration.radiusRange.max - configuration.radiusRange.min) / 100.0}
                value={toNumber(configuration.data.radius)}
                showValue={false}
                onChange={(value) => setRadius(value)}
            />
            )}
            <ChoiceGroup
                defaultSelectedKey="X"
                styles={{ flexContainer: { display: "flex", gap: "16px" } }}
                options={[
                    { key: 'X', text: 'X' },
                    { key: 'Y', text: 'Y' },
                    { key: 'Z', text: 'Z' }]}
                label="Cutaway axis"
                onChange={setCutawayAxis}
                required={true} />
            <Slider
                label="Cutaway"
                min={-1.0}
                max={1.0}
                step={0.01}
                value={configuration.cutaway.length}
                onChange={value => setCutawayLength(value)}
            ></Slider>
        </Stack>

        {/*  */}
        <div style={{ display: 'block', width: '100%', marginTop: '16px' }}></div>
        <Separator></Separator>
        <Text nowrap block variant='large'>Map 1D data</Text>
        {data1DOptions.length <= 0 && ("No more data available.")}
        {
            data1DOptions.length > 0 && (<ComboBox
                label=""
                allowFreeform={false}
                autoComplete={'on'}
                options={data1DOptions}
                onChange={setData1D}
                onItemClick={setData1D}
                style={{ marginTop: '8px', padding: '4px' }}
                shouldRestoreFocus={false}
                selectedKey={
                    (configuration.mapValues.id >= 0) ? configuration.mapValues.id : null
                }
            />)
        }
        <Text nowrap block variant='large'>The other map 1D data</Text>
        {otherData1DOptions.length <= 0 && ("No more data available.")}
        {
            otherData1DOptions.length > 0 && (<ComboBox
                label=""
                allowFreeform={false}
                autoComplete={'on'}
                multiSelect
                options={otherData1DOptions}
                onChange={setOtherData1D}
                // onItemClick={setData1D}
                style={{ marginTop: '8px', padding: '4px' }}
                shouldRestoreFocus={false}
                selectedKey={
                    configuration.otherMapValues.map(k => isoDataID.unwrap(k))
                }
            />)
        }

        {/* SELECTIONS */}
        <div style={{ display: 'block', width: '100%', marginTop: '16px' }}></div>
        <Separator></Separator>
        <SelectionsPart
            selections={selections}
            configurationReducer={configurationReducer}
            dataReducer={props.dataReducer}
            selectionsReducer={props.selectionsReducer}
        ></SelectionsPart>
    </div >
}
