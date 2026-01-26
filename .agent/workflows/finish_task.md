---
description: Workflow to build and commit changes after completing a task
---

1. **Verify Build**
   Run the build script to ensure there are no compilation errors.
   ```bash
   npm run build
   # or if using pnpm
   # pnpm build
   ```

2. **Stage and Commit**
   If the build is successful, stage all changes and commit them.
   ```bash
   git add .
   git commit -m "feat: completed task <description>"
   ```

3. **Push Changes**
   Push the committed changes to the remote repository.
   ```bash
   git push
   ```
