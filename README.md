# ai-color-simulation

## deploy

```bash
rm -rf .next
npm run bulid
rm -rf .aws-sam
sam build
sam deploy --no-confirm-changeset --no-fail-on-empty-changeset --config-file samconfig.toml --config-env stg
```
