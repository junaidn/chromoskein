// import { Checkbox, ChoiceGroup, ConstrainMode, DefaultButton, DetailsList, DetailsListLayoutMode, Dialog, DialogFooter, Dropdown, IChoiceGroupOption, IDropdownOption, IDropdownStyles, PrimaryButton, SelectionMode, Stack } from '@fluentui/react';
// import React, { useEffect, useRef, useState } from 'react';
// import { useAppDispatch } from '../../app/hooks';
// import { ParseCSVConfiguration, parseResultToSparseDistanceMatrix } from '../../modules/parsing/';
// import { dataSlice } from './data';
// import { CSVDelimiter, FileState, FileType, ParseResult, parseToRows } from '../../modules/parsing';

// export function NewDistanceMatrixDialog(props: { hidden: boolean, closeFunction: () => void }) {
//   const dispatch = useAppDispatch();

//   // Reference to the true input file obscured by a fake one (for styling purposes)
//   const inputFileElement = useRef<HTMLInputElement | null>(null);
//   // Click on the real input button when the fake one is pressed
//   const onFakeUploadButtonClick = () => {
//     inputFileElement?.current?.click();
//   };

//   const [, setParseState] = useState(FileState.NoFile);
//   const [files, setFiles] = useState<Array<{ name: string, content: string }>>([]);
//   const [parsedFiles, setParsedFiles] = useState<Array<ParseResult>>([]);

//   const [parseConfiguration, setParseConfiguration] = useState<ParseCSVConfiguration>({ type: FileType.CSV } as ParseCSVConfiguration);
//   const [selectedColumns, setSelectedColumns] = useState<Array<string | number>>([]);

//   // Download files and store their raw content as string
//   const onFilesChanged = () => {
//     if (!inputFileElement || !inputFileElement.current || !inputFileElement.current.files || inputFileElement.current.files.length <= 0) {
//       return;
//     }

//     const files: FileList = inputFileElement.current.files;

//     setParseState(FileState.Downloading);
//     setFiles(() => []);

//     for (let i = 0; i < files.length; i++) {
//       const reader = new FileReader();
//       reader.onload = () => {
//         setFiles(prev => [...prev, {
//           name: files[i].name,
//           content: reader.result as string
//         }]);
//       };
//       reader.readAsText(files[i]);
//     }
//   };

//   // (Re-)Parse the files when new ones are uploaded or the parse configuration changed
//   useEffect(() => {
//     setParseState(FileState.Parsing);
//     setParsedFiles(() => []);

//     for (let i = 0; i < files.length; i++) {
//       setParsedFiles(prev => [...prev, parseToRows(files[i].content, parseConfiguration)]);
//     }
//   }, [files, parseConfiguration]);

//   const closeDialog = () => {
//     props.closeFunction();
//   };

//   const acceptFiles = () => {
//     if (parsedFiles && parsedFiles.length > 0) {
//       const parsedFile = parsedFiles[0];

//       dispatch(dataSlice.actions.addData(
//         {
//           name: files[0].name,
//           type: 'sparse-distance-matrix',
//           data: parseResultToSparseDistanceMatrix(parsedFile, selectedColumns)
//         })
//       );
//     }

//     closeDialog();
//   }

//   const onFileHasHeaderChanged = (ev?: React.FormEvent<HTMLElement | HTMLInputElement>, isChecked?: boolean) => {
//     setParseConfiguration((prev: ParseCSVConfiguration) => ({ ...prev, hasHeader: isChecked ?? false }));
//   }

//   const onDelimiterChange = (ev?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption): void => {
//     if (!option) {
//       return;
//     }

//     switch (option.key) {
//       case "Comma": setParseConfiguration((prev: ParseCSVConfiguration) => ({ ...prev, delimiter: CSVDelimiter.Comma })); break;
//       case "Tabulator": setParseConfiguration((prev: ParseCSVConfiguration) => ({ ...prev, delimiter: CSVDelimiter.Tabulator })); break;
//       case "Space": setParseConfiguration((prev: ParseCSVConfiguration) => ({ ...prev, delimiter: CSVDelimiter.Space })); break;
//     }
//   }

//   const csvDelimiterOptions: IChoiceGroupOption[] = [
//     { key: 'Comma', text: 'Comma' },
//     { key: 'Tabulator', text: 'Tabulator' },
//     { key: 'Space', text: 'Space' },
//   ];

//   const dropdownStyles: Partial<IDropdownStyles> = {
//     dropdown: { width: 150 },
//   };

//   let dropdownOptions: IDropdownOption[] = [];
//   if (parsedFiles && parsedFiles[0]) {
//     dropdownOptions = parsedFiles[0].columns.map(v => { return { key: String(v), text: String(v) }; });
//   }

//   const xyzDropdowns =
//     <div>
//       <Dropdown
//         placeholder="Select a column"
//         label="Column of first bin"
//         options={dropdownOptions}
//         styles={dropdownStyles}
//         onChange={
//           (e, option) => setSelectedColumns((prev: Array<string | number>) => { if (option) prev[0] = option.key; return prev; })
//         }

//       />
//       <Dropdown
//         placeholder="Select a column"
//         label="Column of second bin"
//         options={dropdownOptions}
//         styles={dropdownStyles}
//         onChange={
//           (e, option) => setSelectedColumns((prev: Array<string | number>) => { if (option) prev[1] = option.key; return prev; })
//         }
//       />
//       <Dropdown
//         placeholder="Select a column"
//         label="Column of distance"
//         options={dropdownOptions}
//         styles={dropdownStyles}
//         onChange={
//           (e, option) => setSelectedColumns((prev: Array<string | number>) => { if (option) prev[2] = option.key; return prev; })
//         }
//       />
//     </div>;

//   return (
//     <Dialog hidden={props.hidden} maxWidth="2048" minWidth="1280">
//       <form>
//         <Stack horizontal tokens={{ childrenGap: 10 }}>
//           <Stack tokens={{ childrenGap: 10 }}>
//             <PrimaryButton text="Upload" onClick={onFakeUploadButtonClick} />
//             <input type="file" ref={inputFileElement} onChange={onFilesChanged} style={{ display: 'none' }} />
//               <Checkbox label="Has header" onChange={onFileHasHeaderChanged} />
//               <ChoiceGroup defaultSelectedKey="Comma" options={csvDelimiterOptions} label="CSV delimiter" required={true} onChange={onDelimiterChange} />
//               {xyzDropdowns}
//           </Stack>
//           <div style={{ width: 480 }}>
//             {parsedFiles && parsedFiles[0] && (
//               <DetailsList
//                 items={parsedFiles[0].rows.slice(0, 10)}
//                 columns={parsedFiles[0].columns.map((v, index) => { return { key: String(index), name: String(v), fieldName: String(v), minWidth: 75, maxWidth: 300, isResizable: true }; })}
//                 layoutMode={DetailsListLayoutMode.justified}
//                 constrainMode={ConstrainMode.horizontalConstrained}
//                 selectionMode={SelectionMode.none}
//               />
//             )}
//           </div>
//         </Stack>
//       </form>
//       <DialogFooter>
//         <PrimaryButton text="Add" onClick={acceptFiles} />
//         <DefaultButton text="Cancel" onClick={closeDialog} />
//       </DialogFooter>
//     </Dialog>
//   );
// }

