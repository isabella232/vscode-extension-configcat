import * as vscode from 'vscode';
export class HelpItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        command?: vscode.Command | undefined
    ) {
        super(label, collapsibleState);
        super.command = command;
    }
}