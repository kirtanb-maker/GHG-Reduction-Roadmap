// About this tool — spec v2.0 Section 8 (standard view on every tool with a database).
import { CONTACT, VERSION } from '../lib/settings.js';

const BUILD_DATE = '20 November 2026';

function Item({ title, children }) {
  return (
    <div className="border-t border-panel py-4">
      <h2 className="label mb-1 text-ink">{title}</h2>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6">
        <div className="font-display text-lg font-medium">The Company</div>
        <h1 className="mt-2 font-display text-3xl font-medium sm:text-4xl">About this tool</h1>
      </header>
      <section className="rounded bg-white px-4 sm:px-6" data-testid="about">
        <Item title="What it is for and who runs it">
          The GHG Reduction Roadmap shows The Company's greenhouse-gas pathway from the 2020 base year to the 2030 target:
          base year, done measures, actual emissions, planned measures, the remaining gap and the target.
          It is run by the sustainability team (Kirtan Bergheim). Contact:{' '}
          <a className="underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        </Item>
        <Item title="What it stores">
          Emissions figures and measure names per scope, Scope 3 category, business unit and year. No personal data and no user accounts.
        </Item>
        <Item title="Who can change it">
          Anyone with the link. A Save is visible to everyone. Deleted rows are hidden, not removed, and the team can restore them;
          the most recent Save can be undone with "Undo last save".
        </Item>
        <Item title="Where the data is kept and processed">
          Supabase (database, EU — Frankfurt) and Netlify (website and server functions).
        </Item>
        <Item title="How long it is kept">
          For as long as the roadmap is in use. Deleted rows are kept, hidden, until the team removes them. For corrections, write to{' '}
          <a className="underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        </Item>
        <Item title="Login">None.</Item>
        <Item title="Version">Version {VERSION.replace('v', '')}, last updated {BUILD_DATE}.</Item>
      </section>
      <p className="mt-6 text-sm"><a href="#" className="underline">← Back to the roadmap</a></p>
    </div>
  );
}
