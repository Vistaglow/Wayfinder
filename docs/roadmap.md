# Roadmap

- **Multi-source orchestration.** Tools that call systems outside ServiceNow over outbound REST (HR, finance, document search), using Connection & Credential aliases rather than properties.
- **Admin conversation-history view.** Search, review and retention settings (off by default; 90 days; delete or archive) for conversations and jobs.
- **Richer VA rendering.** Show VA Picker and Boolean messages as buttons instead of text, and forward the escalation summary to the agent.
- **Streaming-like updates.** Write partial assistant text to the job row so the widget can show it while the model is still answering.
- **Entra ID auth.** Bearer tokens instead of API keys (see [azure-foundry.md](azure-foundry.md#optional-entra-id-instead-of-a-key)).
- **Provider choice.** A provider-type dropdown (Azure OpenAI, OpenAI, a custom gateway as an explicit opt-in) with host checks per type.
