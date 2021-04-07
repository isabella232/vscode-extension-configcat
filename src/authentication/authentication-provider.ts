import * as vscode from 'vscode';
import { PublicApiConfiguration } from '../public-api/public-api-configuration';
import { PublicApiService } from '../public-api/public-api.service';

export const contextIsAuthenticated = 'configcat:authenticated';

export class AuthenticationProvider {

    public static secretKey = 'configcat:publicapi-credentials';
    public publicApiConfiguration: PublicApiConfiguration | null = null;

    constructor(private context: vscode.ExtensionContext, private publicApiService: PublicApiService) {
    }

    async checkAuthenticated(): Promise<void> {
        try {
            await this.getAuthenticationConfiguration();
            await vscode.commands.executeCommand('setContext', contextIsAuthenticated, true);
        } catch (error) {
            await this.clear();
        }
    }

    async getAuthenticationConfiguration(): Promise<PublicApiConfiguration | null> {
        const credentialsString = await this.context.secrets.get(AuthenticationProvider.secretKey);
        if (!credentialsString) {
            return Promise.reject();
        }

        const credentials: PublicApiConfiguration = JSON.parse(credentialsString);
        if (!credentials || !credentials.basePath || !credentials.basicAuthUsername || !credentials.basicAuthPassword) {
            return Promise.reject();
        }

        return Promise.resolve(credentials);
    }

    async authenticate(): Promise<PublicApiConfiguration | null> {
        const basicAuthUsername = await vscode.window.showInputBox({
            prompt: 'To use ConfigCat VSCode extension, you should authenticate with your Public API credentials. Please enter your Basic Auth UserName.',
            placeHolder: 'Basic auth username',
            validateInput: this.requiredValidator,
            ignoreFocusOut: true,
        });
        if (!basicAuthUsername) {
            return null;
        }

        const basicAuthPassword = await vscode.window.showInputBox({
            prompt: 'Basic auth password',
            placeHolder: 'Basic auth password',
            validateInput: this.requiredValidator,
            ignoreFocusOut: true,
            password: true,
        });
        if (!basicAuthPassword) {
            return null;
        }

        let basePath = await vscode.window.showInputBox({
            prompt: 'API base URL',
            placeHolder: `Leave blank for default (${PublicApiService.defaultBasePath})`,
            ignoreFocusOut: true
        });
        if (basePath === undefined) {
            return null;
        }
        if (!basePath) {
            basePath = PublicApiService.defaultBasePath;
        }

        const configuration: PublicApiConfiguration = { basePath, basicAuthPassword, basicAuthUsername };

        const meService = this.publicApiService.createMeService(configuration);

        try {
            const me = await meService.getMe();
            await this.context.secrets.store(AuthenticationProvider.secretKey, JSON.stringify(configuration));
            await vscode.commands.executeCommand('setContext', contextIsAuthenticated, true);
            await vscode.window.showInformationMessage('Logged in to ConfigCat. Email: ' + me.body.email);
            return configuration;
        } catch (error) {
            await vscode.window.showWarningMessage('Could not log in to ConfigCat');
            return null;
        }
    }

    async logout() {
        await this.clear();
        vscode.window.showInformationMessage('Logged out from ConfigCat');
    }

    private async clear() {
        await vscode.commands.executeCommand('setContext', contextIsAuthenticated, false);
        await this.context.secrets.delete(AuthenticationProvider.secretKey);
    }

    requiredValidator = (value: string) => {
        if (value) {
            return null;
        }
        return 'Field is required.';
    };

    registerProviders() {
        this.context.subscriptions.push(vscode.commands.registerCommand('configcat.login', async () => {
            await this.authenticate();
        }));
        this.context.subscriptions.push(vscode.commands.registerCommand('configcat.logout', async () => {
            await this.logout();
        }));
        this.context.subscriptions.push(
            this.context.secrets.onDidChange(async e => {
                if (e.key === AuthenticationProvider.secretKey) {
                    await this.checkAuthenticated();
                }
            })
        );
    }
}