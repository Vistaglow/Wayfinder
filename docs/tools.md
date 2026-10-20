# Tools

A tool is a row in `x_snc_wayfinder_ai_tool`. Enabled tools are sent to the model as OpenAI function definitions on every turn, so a new or edited tool is used from the next message. Build them at `/sp?id=wayfinder-tools`.

## Table tools vs built-ins

- **Table tools** (`kind=table`) are generic: read (filtered query), update (one record by sys_id) or create, on any table. No code.
- **Built-ins** (`kind=builtin`) run code in `WayfinderTools`, matched by name: `search_knowledge`, `get_task`, `search_catalog`, `get_catalog_item`, `submit_catalog_request`, `escalate_to_agent`. You can edit their description and parameters; behavior is in code. To add one, write a `_doFoo` method, add a case in `_executeBuiltin`, and create a tool row with `kind=builtin` and the same name.

Every tool returns `{ok, data?, error?}`. Errors go back to the model so it can recover; they are never thrown at the user.

All tools run as the user who is chatting (`GlideRecordSecure`, plus row and field `canRead()` / `canWrite()` checks). An empty result for a low-privilege user is expected behavior, not a bug.

## Placeholders

Read tools build their query from the **encoded query template**:

| Placeholder | Becomes |
|---|---|
| `{param}` | The parameter's value. A clause whose placeholders are all empty is left out, so optional parameters don't become `field=` filters. |
| `{user_sys_id}` or `javascript:gs.getUserID()` | The asking user's sys_id. |
| `{namesearch:param:f1,f2}` | A name search that ignores word order: "John Smith" → `f1LIKEJohn^ORf2LIKEJohn^f1LIKESmith^ORf2LIKESmith`. Words under 2 characters are skipped. |
| `{query}` on a parameter with **Raw query** ticked | A model-written `sysparm_query`, ANDed with the rest of the template. |

Model values are cleaned before substitution: `^`, line breaks and `javascript:` are removed. Raw-query parameters keep `^` but can't start with `OR`, can't use `^NQ`, and can only call date helpers such as `gs.daysAgoStart(7)` through `javascript:`. An invalid query is refused with an error instead of being silently ignored by the platform.

## Example: find_user_by_email

| Step | Value |
|---|---|
| Name | `find_user_by_email` |
| Description | Look up an employee by email address. Use when the user gives an email and wants that person's name, title, department or manager, or when another tool needs a user's sys_id. Pass the full address. |
| Action | Read |
| Table | `sys_user` |
| Parameters | `email` (Text, required): "Full email address, e.g. jane.doe@example.com" |
| Fields | sys_id, name, title, department, manager, email |
| Filter | `active=true^email={email}` |
| Default max results | 1 |

Test it in step 8 with an address you know, save it, and ask the chat "who is jane.doe@example.com?".

## Writing descriptions

The description is the routing logic the model reads, not documentation for people.

1. **Lead with the trigger**: when should the model call it? "Use when the user wants…".
2. **State the scope**: which records, whose records.
3. **Hint at the input format**: "pass the number with its prefix", "1–4 keywords".
4. **Note limits and follow-ups**: "call get_task first", "never say connected".
5. **Fix mis-routing in the description**, not by renaming parameters. If the model picks the wrong tool, say in each description when to use the *other* tool.

Turn on **Ask for approval before running** for update and create tools.
