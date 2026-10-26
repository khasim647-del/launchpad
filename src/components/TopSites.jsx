import SiteIcon from './SiteIcon.jsx'
import { TOP_SITES } from '../data.js'

// The "Top websites" section: a fixed list of useful sites.
function TopSites() {
  return (
    <section className="section" aria-labelledby="top-sites-heading">
      <div className="section-header">
        <h2 id="top-sites-heading">Top websites</h2>
      </div>

      <ul className="top-sites">
        {TOP_SITES.map((site) => (
          <li key={site.url}>
            <a href={site.url} target="_blank" rel="noopener noreferrer" className="top-site">
              <SiteIcon name={site.name} url={site.url} size="small" />
              <span className="top-site-text">
                <span className="top-site-name">{site.name}</span>
                <span className="top-site-description">{site.description}</span>
              </span>
              <span className="top-site-arrow" aria-hidden="true">↗</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default TopSites
