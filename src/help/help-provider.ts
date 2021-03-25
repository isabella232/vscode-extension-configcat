import * as vscode from 'vscode';
import { HelpItem } from './help-item';

export class HelpProvider implements vscode.TreeDataProvider<HelpItem> {

    constructor(private context: vscode.ExtensionContext) {
    }

    getTreeItem(element: HelpItem): HelpItem {
        return element;
    }

    getChildren(element?: HelpItem): Thenable<HelpItem[]> {
        if (!element) {
            const docsElement = new HelpItem('Docs', vscode.TreeItemCollapsibleState.None, {
                command: 'vscode.open', title: 'ConfigCat Docs',
                arguments: [vscode.Uri.parse('https://configcat.com/docs')]
            }, '$(info)');
            return Promise.resolve([docsElement]);
        }

        return Promise.resolve([]);
    }
}

export async function registerHelpProviders(context: vscode.ExtensionContext) {
    const helpProvider = new HelpProvider(context);
    const help = vscode.window.createTreeView('configcat.help', {
        treeDataProvider: helpProvider
    });
    context.subscriptions.push(help);
}