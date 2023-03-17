import * as vscode from 'vscode';
import { Configuration as OpenAIConfiguration, OpenAIApi } from 'openai';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('extension.generateCode', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found.');
      return;
    }

    const selectedText = editor.document.getText(editor.selection);
    if (!selectedText) {
      vscode.window.showErrorMessage('No text selected.');
      return;
    }

    try {
      let apiKey = vscode.workspace.getConfiguration('openai-companion').get<string>('apiKey');
      if (!apiKey) {
        vscode.window.showWarningMessage(
          'No OpenAI API key found in VSCode configuration openai-companion.apiKey. Will try env variable OPENAI_API_KEY.'
        );
        apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          vscode.window.showErrorMessage(
            'Environment variable OPENAI_API_KEY does not exist.'
          );
          return;
        }
      }

      const configuration = new OpenAIConfiguration({
        apiKey,
      });
      const client = new OpenAIApi(configuration);

      const result = await client.createCompletion({
        model: "text-davinci-002",
        prompt: selectedText,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        max_tokens: 1000,
        n: 1,
        stop: null,
        temperature: 0.5,
      });

      const generatedCode = result.data.choices[0].text;
      if (!generatedCode) {
        vscode.window.showErrorMessage('Unable to generate code... 😢');
        return;
      }

      editor.edit((editBuilder) => {
        editBuilder.insert(editor.selection.end, generatedCode);
      });
    } catch (error) {
      const { message } = error as { message?: string; };
      vscode.window.showErrorMessage(`Error generating code: ${message ? message : JSON.stringify(error)}`);
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {
  // Nothing needed here
}
