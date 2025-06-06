# Rule: Firestore Indexes Reminder
# Description: Reminds to update the index generation script when Firestore queries are changed.

## Trigger
When a file is saved that contains `where(`, `orderBy(`, or `onSnapshot(`.

## Action
Remind the user with the following message:

"You've modified a file containing a Firestore query (`where`, `orderBy`, `onSnapshot`).

Please ensure that `scripts/generate-firestore-indexes.ts` is updated with any new composite indexes that may be required.

After updating the script, run `pnpm run deploy:indexes:dev` or `pnpm run deploy:indexes:prod` to deploy the changes." 