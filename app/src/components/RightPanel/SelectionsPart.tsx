import { ChromatinViewportConfiguration, D1ViewportConfiguration, DistanceMapDataConfiguration, DistanceViewportConfiguration, ForceGraphViewportConfiguration, ViewportConfiguration, ViewportConfigurationType, ViewportSelectionOptions } from "../../modules/storage/models/viewports";
import { DataAction, DataID, DataState, isoDataID } from "../../modules/storage/models/data";
import { isoSelectionID, SelectionAction, SelectionActionKind, SelectionID, Selection, SelectionState } from "../../modules/storage/models/selections";
import { ConfigurationReducer, ConfigurationsWithSelections, useConfiguration, useSelections, useViewportName } from "../hooks";

import React, { Dispatch, useEffect, useState } from "react";
import { Text } from '@fluentui/react/lib/Text';
import { Delete16Regular, EyeShow16Regular, EyeOff16Regular, Rename16Regular } from '@fluentui/react-icons';
import { PrimaryButton, TextField } from "@fluentui/react";

export interface PropsSelectionsPart<T extends ViewportConfiguration> {
    selections: Array<[Selection, ViewportSelectionOptions]>,
    configurationReducer: ConfigurationReducer<T>,
    dataReducer: [DataState, Dispatch<DataAction>],
    selectionsReducer: [SelectionState, Dispatch<SelectionAction>],
}

export function SelectionsPart<T extends ConfigurationsWithSelections>(props: PropsSelectionsPart<T>): JSX.Element {
    const [data, dataDispatch] = props.dataReducer;
    const [globalSelections, globalSelectionsDispatch] = props.selectionsReducer;
    const [configuration, updateConfiguration] = props.configurationReducer;

    const selectedDataPartID: DataID | SelectionID | null = configuration.data ? configuration.data.id : null;

    const selections = props.selections;
    const [renaming, setRenaming] = useState<{ id: SelectionID, newName: string } | null>(null);

    if (!configuration.data) return <div></div>;

    if (configuration.type == ViewportConfigurationType.TAD && configuration.data.type == DistanceMapDataConfiguration.Selection) {
        return <div></div>;
    }

    const addSelection = () => {
        if (selectedDataPartID) {
            const dataSize = data.data.find(d => d.id == selectedDataPartID)?.values?.length;

            if (dataSize) {
                globalSelectionsDispatch({ type: SelectionActionKind.ADD, dataID: selectedDataPartID as DataID, dataSize });
            }
        }
    }

    const selectSelection = (selectionID: SelectionID) => {
        updateConfiguration({
            ...configuration,
            selectedSelectionID: selectionID,
        });
    }

    const handleRenameStart = (selection: Selection) => setRenaming({ id: selection.id, newName: selection.name })
    const handleRenameChange = (newName: string | undefined) => setRenaming({ ...renaming!, newName: newName ?? "" })
    const handleRenameEnd = () => {
        const selection = globalSelections.selections.find((s) => s.id === renaming!.id);
        if (selection == null) {
            throw "Selection to rename no longer exists."
        }
        globalSelectionsDispatch({
            type: SelectionActionKind.UPDATE,
            ...selection,
            name: renaming!.newName.length == 0 ? "unnamed" : renaming!.newName
        })
        setRenaming(null);

    }

    const setSelectionVisiblity = (selectionID: SelectionID, visible: boolean) => {
        if (!configuration.data) return;

        const associatedSelectionIndex = configuration.data.selections.findIndex(s => s.selectionID == selectionID);
        const newData = {
            ...configuration.data,
            selections: configuration.data.selections.map((s: ViewportSelectionOptions) => { return { selectionID: s.selectionID, visible: s.visible } }),
        };

        newData.selections[associatedSelectionIndex].visible = visible;

        updateConfiguration({
            ...configuration,
            data: newData,
        });
    }

    const removeSelection = (selectionID: SelectionID) => {
        if (!configuration) return;

        globalSelectionsDispatch({
            type: SelectionActionKind.REMOVE,
            id: selectionID,
        });
    }

    return <div><Text nowrap block variant='large'>Selections</Text>
        {selectedDataPartID != null && selections.map(([selection, associatedData]) => {
            if (renaming && renaming.id === selection.id) {
                return <div
                    className={selection.id == configuration.selectedSelectionID ? "treeViewListItem selected" : "treeViewListItem"}
                    key={isoSelectionID.unwrap(selection.id)}
                    onClick={() => selectSelection(selection.id)}>
                    <span className='selectionColorbox' style={{ backgroundColor: `rgb(${selection.color.r * 255}, ${selection.color.g * 255}, ${selection.color.b * 255})` }}></span>
                    <span style={{ display: 'block', width: '4px' }}></span>
                    <TextField className="text" defaultValue={selection.name} onChange={(_e, newName) => handleRenameChange(newName)} onKeyDown={(e) => e.key === 'Enter' && handleRenameEnd()}></TextField>
                    <Rename16Regular primaryFill={'white'} className='icon iconHoverBlue' onClick={handleRenameEnd}></Rename16Regular>
                    {(associatedData.visible) && (<EyeShow16Regular primaryFill={'white'} className='icon iconHoverBlue' onClick={(e) => { e.stopPropagation(); setSelectionVisiblity(selection.id, false) }}></EyeShow16Regular>)}
                    {(!associatedData.visible) && (<EyeOff16Regular primaryFill={'white'} className='icon iconHoverBlue' onClick={(e) => { e.stopPropagation(); setSelectionVisiblity(selection.id, true) }}></EyeOff16Regular>)}
                    <Delete16Regular primaryFill={'white'} className='icon iconHoverRed' onClick={(e) => { e.stopPropagation(); removeSelection(selection.id) }}></Delete16Regular>
                </div>
            } else {
                return <div
                    className={selection.id == configuration.selectedSelectionID ? "treeViewListItem selected" : "treeViewListItem"}
                    key={isoSelectionID.unwrap(selection.id)}
                    onClick={() => selectSelection(selection.id)}>
                    <span className='selectionColorbox' style={{ backgroundColor: `rgb(${selection.color.r * 255}, ${selection.color.g * 255}, ${selection.color.b * 255})` }}></span>
                    <span style={{ display: 'block', width: '4px' }}></span>
                    <span className='text'>{selection.name}</span>
                    <Rename16Regular primaryFill={'white'} className='icon iconHoverBlue' onClick={() => handleRenameStart(selection)}></Rename16Regular>
                    {(associatedData.visible) && (<EyeShow16Regular primaryFill={'white'} className='icon iconHoverBlue' onClick={(e) => { e.stopPropagation(); setSelectionVisiblity(selection.id, false) }}></EyeShow16Regular>)}
                    {(!associatedData.visible) && (<EyeOff16Regular primaryFill={'white'} className='icon iconHoverBlue' onClick={(e) => { e.stopPropagation(); setSelectionVisiblity(selection.id, true) }}></EyeOff16Regular>)}
                    <Delete16Regular primaryFill={'white'} className='icon iconHoverRed' onClick={(e) => { e.stopPropagation(); removeSelection(selection.id) }}></Delete16Regular>
                </div>
            }
        })}
        {(selectedDataPartID != null) && (<PrimaryButton text='Add selection' style={{ marginTop: '8px' }} onClick={() => addSelection()} />)}
    </div>
}