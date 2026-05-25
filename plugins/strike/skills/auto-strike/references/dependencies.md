# Dependencies And Install Discipline

Use this before adding or upgrading packages, changing lockfiles, running
migrations, approving build scripts, or making package-shaped architecture
choices.

Before adding or upgrading a dependency, confirm:

- the repo does not already have an adequate local pattern or package
- the dependency solves real complexity or risk for the active slice
- current official docs support the intended usage
- the version fits the repo runtime, framework, bundler, and deployment target
- security, maintenance, license, bundle/runtime impact, and vendor lock-in are
  acceptable
- vendor-specific code is isolated behind a purpose-named adapter when the
  surface is replaceable or high risk

Do not install packages, run migrations, approve build scripts, or change
generated lockfiles unless the user approves or repo instructions clearly allow
it. If approval is needed, explain the package, why it is needed, and the
alternative.

For greenfield work, do not silently turn setup into an architecture decision.
Use existing repo signals first. If there are no useful signals, recommend a
small default stack or no-install prototype path, ask before dependency
installation, and record the chosen setup plus any blocked install step in
`auto-strike/`.
