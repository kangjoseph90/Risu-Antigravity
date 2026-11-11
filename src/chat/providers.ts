import { RisuAPI } from '../api';
import { REQUEST_TYPES, getRequestTypeLabel } from '../shared/types';
import { handleRequest } from './index';

export async function registerProviders(): Promise<void> {
    for (const type of REQUEST_TYPES) {
        const name = `[Antigravity] ${getRequestTypeLabel(type)}`;
        await RisuAPI.addProvider(name, (args, signal) => handleRequest(args, signal, type), {
            tokenizer: 'gemma',
            model: {
                name, shortName: getRequestTypeLabel(type), fullName: name,
                // The model can change in the tab without re-registering this entry.
                flags: [0, 6, 8], tokenizer: 9,
                parameters: ['temperature', 'top_p', 'frequency_penalty', 'presence_penalty', 'top_k'],
            },
        });
    }
}
