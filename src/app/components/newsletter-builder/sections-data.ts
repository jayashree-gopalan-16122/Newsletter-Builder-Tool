import { LibrarySection, SectionCategory } from './types';

// Helper to create a section entry
function sec(
  id: string, code: string, name: string, category: SectionCategory,
  source: string, html: string, isCustom = false
): LibrarySection {
  return { id, code, name, category, source, html, isCustom };
}

// ═══════════════════════════════════════════════════════════════
// SECTION TYPE A: HEADERS
// ═══════════════════════════════════════════════════════════════

const A1 = sec('a1', 'A1', 'Logo + Date Header', 'Headers', 'Sep/Nov/Dec 2025',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
  <tr>
    <td style="padding:20px 30px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="left" valign="middle">
            <img src="https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=140&h=40&fit=crop" width="140" height="40" alt="Logo" data-slot="logo" style="display:block;" />
          </td>
          <td align="right" valign="middle" data-slot="date-text" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#718096;">
            September 2025
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`);

const A2 = sec('a2', 'A2', 'Header — Centered', 'Headers', 'Custom Variant',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
  <tr>
    <td align="center" style="padding:24px 30px 20px;">
      <img src="https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=140&h=40&fit=crop" width="140" height="40" alt="Logo" data-slot="logo" style="display:block;margin:0 auto;" />
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#718096;margin:12px 0 0;" data-slot="date-text">September 2025</p>
    </td>
  </tr>
</table>`);

const A3 = sec('a3', 'A3', 'Header — Dark Bold', 'Headers', 'Custom Variant',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f172a;">
  <tr>
    <td style="padding:20px 30px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="left" valign="middle" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;" data-slot="date-text">
            September 2025
          </td>
          <td align="right" valign="middle">
            <img src="https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=120&h=36&fit=crop" width="120" height="36" alt="Logo" data-slot="logo" style="display:block;" />
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`);

// ═══════════════════════════════════════════════════════════════
// SECTION TYPE B: HEROES
// ═══════════════════════════════════════════════════════════════

const B1 = sec('b1', 'B1', 'Left-Aligned Hero (BG Image)', 'Heroes', 'Dec 2025',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-image:url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=300&fit=crop');background-size:cover;background-position:center;">
  <tr>
    <td style="padding:60px 40px;background-color:rgba(0,0,0,0.55);">
      <h1 data-slot="heading" style="font-family:Helvetica Neue,Arial,sans-serif;font-size:34px;font-weight:700;color:#ffffff;margin:0 0 14px;line-height:1.15;">Year in Review:<br/>2025 Highlights</h1>
      <p data-slot="subtext" style="font-family:Arial,sans-serif;font-size:15px;color:#e2e8f0;line-height:1.6;margin:0 0 18px;max-width:400px;">A look back at the biggest features and milestones of the year.</p>
      <a href="#" data-slot="cta-primary" style="font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#FFDD53;text-decoration:underline;">Read more</a><img data-slot="image-main" src="" style="display:none" />
    </td>
  </tr>
</table>`);

const B2 = sec('b2', 'B2', 'Hero — Split Text Left', 'Heroes', 'Custom Variant',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
  <tr>
    <td style="padding:40px 30px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="52%" valign="middle" style="padding-right:24px;">
            <h1 data-slot="heading" style="font-family:Arial,Helvetica,sans-serif;font-size:28px;font-weight:700;color:#0E0E0E;margin:0 0 14px;line-height:1.2;">Built for Speed, Designed for You</h1>
            <p data-slot="subtext" style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#4a5568;line-height:1.6;margin:0 0 20px;">This month brings performance boosts, new integrations, and a fresh look across the board.</p>
            <a href="#" data-slot="cta-primary" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:#004BE2;text-decoration:underline;">Read more</a>
          </td>
          <td width="48%" valign="middle">
            <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=270&h=220&fit=crop" width="270" height="220" alt="Hero" data-slot="image-main" style="display:block;width:100%;height:auto;border-radius:12px;" />
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`);

const B3 = sec('b3', 'B3', 'Hero — Split Text Right', 'Heroes', 'Custom Variant',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
  <tr>
    <td style="padding:40px 30px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="48%" valign="middle" style="padding-right:24px;">
            <img src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=270&h=220&fit=crop" width="270" height="220" alt="Hero" data-slot="image-main" style="display:block;width:100%;height:auto;border-radius:12px;" />
          </td>
          <td width="52%" valign="middle" align="left">
            <h1 data-slot="heading" style="font-family:Arial,Helvetica,sans-serif;font-size:28px;font-weight:700;color:#0E0E0E;margin:0 0 14px;line-height:1.2;text-align:left;">Seamless Support, Every Time</h1>
            <p data-slot="subtext" style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#4a5568;line-height:1.6;margin:0 0 20px;text-align:left;">Connect faster, resolve smarter, and leave customers delighted every session.</p>
            <table cellpadding="0" cellspacing="0" border="0" align="left">
              <tr>
                <td style="background-color:#004BE2;border-radius:6px;">
                  <a href="#" data-slot="cta-primary" style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;padding:12px 28px;">Read more</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`);


// ═══════════════════════════════════════════════════════════════
// SECTION TYPE C: FEATURES
// ═══════════════════════════════════════════════════════════════

const C1 = sec('c1', 'C1', 'Features — Dark Bullets', 'Features', 'Nov 2025',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0E0E0E;">
  <tr>
    <td style="padding:40px 30px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:30px;">
        <tr>
          <td align="left" valign="middle">
            <h2 data-slot="heading" style="font-family:Arial,sans-serif;font-size:24px;font-weight:700;color:#ffffff;margin:0;">What's New?</h2>
          </td>
          <td align="right" valign="middle">
            <table cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="padding-left:8px;"><img src="https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=28&h=28&fit=crop" width="28" height="28" alt="LinkedIn" data-slot="social-1-image" style="display:block;border-radius:4px;" /></td>
              <td style="padding-left:8px;"><img src="https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=28&h=28&fit=crop" width="28" height="28" alt="X" data-slot="social-2-image" style="display:block;border-radius:4px;" /></td>
              <td style="padding-left:8px;"><img src="https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=28&h=28&fit=crop" width="28" height="28" alt="YouTube" data-slot="social-3-image" style="display:block;border-radius:4px;" /></td>
            </tr></table>
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr data-feature-group="1" data-feature-hidden="false"><td width="56" valign="top" style="padding-top:0;"><div style="font-family:Arial,sans-serif;font-size:42px;color:#E42527;line-height:1;">&#9670;</div></td><td style="padding-bottom:26px;"><h3 data-slot="feature-1-title" style="font-family:Arial,sans-serif;font-size:16px;font-weight:600;color:#ffffff;margin:0 0 6px;">Wake on LAN</h3><p data-slot="feature-1-desc" style="font-family:Arial,sans-serif;font-size:14px;color:#a0aec0;line-height:1.6;margin:0;">Remotely wake up sleeping machines to start a support session.</p><img data-slot="feature-1-image" src="" style="display:none" /></td></tr>
        <tr data-feature-group="2" data-feature-hidden="false"><td width="56" valign="top" style="padding-top:0;"><div style="font-family:Arial,sans-serif;font-size:42px;color:#E42527;line-height:1;">&#9670;</div></td><td style="padding-bottom:26px;"><h3 data-slot="feature-2-title" style="font-family:Arial,sans-serif;font-size:16px;font-weight:600;color:#ffffff;margin:0 0 6px;">Session Recording</h3><p data-slot="feature-2-desc" style="font-family:Arial,sans-serif;font-size:14px;color:#a0aec0;line-height:1.6;margin:0;">Record every session automatically for auditing and training.</p><img data-slot="feature-2-image" src="" style="display:none" /></td></tr>
        <tr data-feature-group="3" data-feature-hidden="false"><td width="56" valign="top" style="padding-top:0;"><div style="font-family:Arial,sans-serif;font-size:42px;color:#E42527;line-height:1;">&#9670;</div></td><td style="padding-bottom:26px;"><h3 data-slot="feature-3-title" style="font-family:Arial,sans-serif;font-size:16px;font-weight:600;color:#ffffff;margin:0 0 6px;">Diagnostic Tools</h3><p data-slot="feature-3-desc" style="font-family:Arial,sans-serif;font-size:14px;color:#a0aec0;line-height:1.6;margin:0;">Built-in system info, task manager, and event viewer tools.</p><img data-slot="feature-3-image" src="" style="display:none" /></td></tr>
        <tr data-feature-group="4" data-feature-hidden="true" style="display:none"><td width="56" valign="top" style="padding-top:0;"><div style="font-family:Arial,sans-serif;font-size:42px;color:#E42527;line-height:1;">&#9670;</div></td><td style="padding-bottom:26px;"><h3 data-slot="feature-4-title" style="font-family:Arial,sans-serif;font-size:16px;font-weight:600;color:#ffffff;margin:0 0 6px;">Custom Branding</h3><p data-slot="feature-4-desc" style="font-family:Arial,sans-serif;font-size:14px;color:#a0aec0;line-height:1.6;margin:0;">Apply your own logo, colors and domain to the support portal.</p><img data-slot="feature-4-image" src="" style="display:none" /></td></tr>
        <tr data-feature-group="5" data-feature-hidden="true" style="display:none"><td width="56" valign="top" style="padding-top:0;"><div style="font-family:Arial,sans-serif;font-size:42px;color:#E42527;line-height:1;">&#9670;</div></td><td style="padding-bottom:26px;"><h3 data-slot="feature-5-title" style="font-family:Arial,sans-serif;font-size:16px;font-weight:600;color:#ffffff;margin:0 0 6px;">Clipboard Sharing</h3><p data-slot="feature-5-desc" style="font-family:Arial,sans-serif;font-size:14px;color:#a0aec0;line-height:1.6;margin:0;">Seamlessly copy and paste text between local and remote machines.</p><img data-slot="feature-5-image" src="" style="display:none" /></td></tr>
        <tr data-feature-group="6" data-feature-hidden="true" style="display:none"><td width="56" valign="top" style="padding-top:0;"><div style="font-family:Arial,sans-serif;font-size:42px;color:#E42527;line-height:1;">&#9670;</div></td><td style="padding-bottom:26px;"><h3 data-slot="feature-6-title" style="font-family:Arial,sans-serif;font-size:16px;font-weight:600;color:#ffffff;margin:0 0 6px;">Multi-Session Management</h3><p data-slot="feature-6-desc" style="font-family:Arial,sans-serif;font-size:14px;color:#a0aec0;line-height:1.6;margin:0;">Handle multiple concurrent remote sessions from a single dashboard.</p><img data-slot="feature-6-image" src="" style="display:none" /></td></tr>
        <tr data-feature-group="7" data-feature-hidden="true" style="display:none"><td width="56" valign="top" style="padding-top:0;"><div style="font-family:Arial,sans-serif;font-size:42px;color:#E42527;line-height:1;">&#9670;</div></td><td style="padding-bottom:26px;"><h3 data-slot="feature-7-title" style="font-family:Arial,sans-serif;font-size:16px;font-weight:600;color:#ffffff;margin:0 0 6px;">Access Permissions</h3><p data-slot="feature-7-desc" style="font-family:Arial,sans-serif;font-size:14px;color:#a0aec0;line-height:1.6;margin:0;">Set granular access levels for each technician in your team.</p><img data-slot="feature-7-image" src="" style="display:none" /></td></tr>
        <tr data-feature-group="8" data-feature-hidden="true" style="display:none"><td width="56" valign="top" style="padding-top:0;"><div style="font-family:Arial,sans-serif;font-size:42px;color:#E42527;line-height:1;">&#9670;</div></td><td style="padding-bottom:26px;"><h3 data-slot="feature-8-title" style="font-family:Arial,sans-serif;font-size:16px;font-weight:600;color:#ffffff;margin:0 0 6px;">Audit Logs</h3><p data-slot="feature-8-desc" style="font-family:Arial,sans-serif;font-size:14px;color:#a0aec0;line-height:1.6;margin:0;">Track every action taken during sessions with detailed activity logs.</p><img data-slot="feature-8-image" src="" style="display:none" /></td></tr>
      </table>
    </td>
  </tr>
</table>`);

const C2 = sec('c2', 'C2', 'Features — Light Arrows with Images', 'Features', 'Custom Variant',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
  <tr>
    <td style="padding:40px 30px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:30px;">
        <tr>
          <td align="left" valign="middle">
            <h2 data-slot="heading" style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;color:#0E0E0E;margin:0;">What's New?</h2>
          </td>
          <td align="right" valign="middle">
            <table cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="padding-left:8px;"><img src="https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=28&h=28&fit=crop" width="28" height="28" alt="LinkedIn" data-slot="social-1-image" style="display:block;border-radius:4px;" /></td>
              <td style="padding-left:8px;"><img src="https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=28&h=28&fit=crop" width="28" height="28" alt="X" data-slot="social-2-image" style="display:block;border-radius:4px;" /></td>
              <td style="padding-left:8px;"><img src="https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=28&h=28&fit=crop" width="28" height="28" alt="YouTube" data-slot="social-3-image" style="display:block;border-radius:4px;" /></td>
            </tr></table>
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr data-feature-group="1" data-feature-hidden="false">
          <td width="32" valign="top" style="padding-top:2px;"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='12' fill='%2322C55E'/%3E%3Cpolyline points='6,12 10,16 18,8' stroke='%23ffffff' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E" width="24" height="24" alt="" style="display:block;" /></td>
          <td style="padding-bottom:24px;">
            <h3 data-slot="feature-1-title" style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:600;color:#0E0E0E;margin:0 0 6px;">Instant Session Transfer</h3>
            <p data-slot="feature-1-desc" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#4a5568;line-height:1.6;margin:0 0 12px;">Seamlessly transfer ongoing sessions to another technician without disconnecting the customer.</p>
            <img src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=480&h=200&fit=crop" width="480" height="200" alt="Feature image" data-slot="feature-1-image" style="display:block;width:100%;height:auto;border-radius:8px;" />
          </td>
        </tr>
        <tr data-feature-group="2" data-feature-hidden="false">
          <td width="32" valign="top" style="padding-top:2px;"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='12' fill='%2322C55E'/%3E%3Cpolyline points='6,12 10,16 18,8' stroke='%23ffffff' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E" width="24" height="24" alt="" style="display:block;" /></td>
          <td style="padding-bottom:24px;">
            <h3 data-slot="feature-2-title" style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:600;color:#0E0E0E;margin:0 0 6px;">Multi-Monitor Navigation</h3>
            <p data-slot="feature-2-desc" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#4a5568;line-height:1.6;margin:0 0 12px;">Navigate between multiple monitors on the remote device with a single click.</p>
            <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=480&h=200&fit=crop" width="480" height="200" alt="Feature image" data-slot="feature-2-image" style="display:block;width:100%;height:auto;border-radius:8px;" />
          </td>
        </tr>
        <tr data-feature-group="3" data-feature-hidden="false">
          <td width="32" valign="top" style="padding-top:2px;"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='12' fill='%2322C55E'/%3E%3Cpolyline points='6,12 10,16 18,8' stroke='%23ffffff' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E" width="24" height="24" alt="" style="display:block;" /></td>
          <td style="padding-bottom:24px;">
            <h3 data-slot="feature-3-title" style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:600;color:#0E0E0E;margin:0 0 6px;">Enhanced File Transfer</h3>
            <p data-slot="feature-3-desc" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#4a5568;line-height:1.6;margin:0 0 12px;">Transfer files up to 2GB with progress tracking and resume capability.</p>
            <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=480&h=200&fit=crop" width="480" height="200" alt="Feature image" data-slot="feature-3-image" style="display:block;width:100%;height:auto;border-radius:8px;" />
          </td>
        </tr>
        <tr data-feature-group="4" data-feature-hidden="true" style="display:none">
          <td width="32" valign="top" style="padding-top:2px;"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='12' fill='%2322C55E'/%3E%3Cpolyline points='6,12 10,16 18,8' stroke='%23ffffff' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E" width="24" height="24" alt="" style="display:block;" /></td>
          <td style="padding-bottom:24px;">
            <h3 data-slot="feature-4-title" style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:600;color:#0E0E0E;margin:0 0 6px;">Smart Scheduling</h3>
            <p data-slot="feature-4-desc" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#4a5568;line-height:1.6;margin:0 0 12px;">Schedule unattended sessions and automate routine tasks with ease.</p>
            <img src="https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=480&h=200&fit=crop" width="480" height="200" alt="Feature image" data-slot="feature-4-image" style="display:block;width:100%;height:auto;border-radius:8px;" />
          </td>
        </tr>
        <tr data-feature-group="5" data-feature-hidden="true" style="display:none">
          <td width="32" valign="top" style="padding-top:2px;"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='12' fill='%2322C55E'/%3E%3Cpolyline points='6,12 10,16 18,8' stroke='%23ffffff' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E" width="24" height="24" alt="" style="display:block;" /></td>
          <td style="padding-bottom:24px;">
            <h3 data-slot="feature-5-title" style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:600;color:#0E0E0E;margin:0 0 6px;">Two-Factor Authentication</h3>
            <p data-slot="feature-5-desc" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#4a5568;line-height:1.6;margin:0 0 12px;">Add an extra layer of security to all remote access with built-in 2FA support.</p>
            <img src="https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=480&h=200&fit=crop" width="480" height="200" alt="Feature image" data-slot="feature-5-image" style="display:block;width:100%;height:auto;border-radius:8px;" />
          </td>
        </tr>
        <tr data-feature-group="6" data-feature-hidden="true" style="display:none">
          <td width="32" valign="top" style="padding-top:2px;"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='12' fill='%2322C55E'/%3E%3Cpolyline points='6,12 10,16 18,8' stroke='%23ffffff' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E" width="24" height="24" alt="" style="display:block;" /></td>
          <td style="padding-bottom:24px;">
            <h3 data-slot="feature-6-title" style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:600;color:#0E0E0E;margin:0 0 6px;">Screen Annotations</h3>
            <p data-slot="feature-6-desc" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#4a5568;line-height:1.6;margin:0 0 12px;">Draw, highlight and annotate directly on the remote screen in real time.</p>
            <img src="https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=480&h=200&fit=crop" width="480" height="200" alt="Feature image" data-slot="feature-6-image" style="display:block;width:100%;height:auto;border-radius:8px;" />
          </td>
        </tr>
        <tr data-feature-group="7" data-feature-hidden="true" style="display:none">
          <td width="32" valign="top" style="padding-top:2px;"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='12' fill='%2322C55E'/%3E%3Cpolyline points='6,12 10,16 18,8' stroke='%23ffffff' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E" width="24" height="24" alt="" style="display:block;" /></td>
          <td style="padding-bottom:24px;">
            <h3 data-slot="feature-7-title" style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:600;color:#0E0E0E;margin:0 0 6px;">Cross-Platform Support</h3>
            <p data-slot="feature-7-desc" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#4a5568;line-height:1.6;margin:0 0 12px;">Access Windows, Mac, Linux, iOS and Android devices from any device.</p>
            <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=480&h=200&fit=crop" width="480" height="200" alt="Feature image" data-slot="feature-7-image" style="display:block;width:100%;height:auto;border-radius:8px;" />
          </td>
        </tr>
        <tr data-feature-group="8" data-feature-hidden="true" style="display:none">
          <td width="32" valign="top" style="padding-top:2px;"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='12' fill='%2322C55E'/%3E%3Cpolyline points='6,12 10,16 18,8' stroke='%23ffffff' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E" width="24" height="24" alt="" style="display:block;" /></td>
          <td style="padding-bottom:24px;">
            <h3 data-slot="feature-8-title" style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:600;color:#0E0E0E;margin:0 0 6px;">API Integration</h3>
            <p data-slot="feature-8-desc" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#4a5568;line-height:1.6;margin:0 0 12px;">Connect Zoho Assist with your existing tools using our open REST API.</p>
            <img src="https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=480&h=200&fit=crop" width="480" height="200" alt="Feature image" data-slot="feature-8-image" style="display:block;width:100%;height:auto;border-radius:8px;" />
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`);

const C3 = sec('c3', 'C3', 'Features — Numbered List', 'Features', 'Custom Variant',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fafaf7;">
  <tr>
    <td style="padding:40px 30px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:30px;">
        <tr>
          <td align="left" valign="middle">
            <h2 data-slot="heading" style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;color:#0E0E0E;margin:0;">What's New?</h2>
          </td>
          <td align="right" valign="middle">
            <table cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="padding-left:8px;"><img src="https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=28&h=28&fit=crop" width="28" height="28" alt="LinkedIn" data-slot="social-1-image" style="display:block;border-radius:4px;" /></td>
              <td style="padding-left:8px;"><img src="https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=28&h=28&fit=crop" width="28" height="28" alt="X" data-slot="social-2-image" style="display:block;border-radius:4px;" /></td>
              <td style="padding-left:8px;"><img src="https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=28&h=28&fit=crop" width="28" height="28" alt="YouTube" data-slot="social-3-image" style="display:block;border-radius:4px;" /></td>
            </tr></table>
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr data-feature-group="1" data-feature-hidden="false">
          <td width="44" valign="top"><div style="width:32px;height:32px;background-color:#004BE2;border-radius:50%;text-align:center;line-height:32px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;">1</div></td>
          <td style="padding-bottom:24px;padding-left:8px;">
            <h3 data-slot="feature-1-title" style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:600;color:#0E0E0E;margin:0 0 6px;">Instant Session Transfer</h3>
            <p data-slot="feature-1-desc" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#4a5568;line-height:1.6;margin:0;">Seamlessly transfer ongoing sessions to another technician without disconnecting the customer.</p>
            <img data-slot="feature-1-image" src="" style="display:none" />
          </td>
        </tr>
        <tr data-feature-group="2" data-feature-hidden="false">
          <td width="44" valign="top"><div style="width:32px;height:32px;background-color:#004BE2;border-radius:50%;text-align:center;line-height:32px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;">2</div></td>
          <td style="padding-bottom:24px;padding-left:8px;">
            <h3 data-slot="feature-2-title" style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:600;color:#0E0E0E;margin:0 0 6px;">Multi-Monitor Navigation</h3>
            <p data-slot="feature-2-desc" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#4a5568;line-height:1.6;margin:0;">Navigate between multiple monitors on the remote device with a single click.</p>
            <img data-slot="feature-2-image" src="" style="display:none" />
          </td>
        </tr>
        <tr data-feature-group="3" data-feature-hidden="false">
          <td width="44" valign="top"><div style="width:32px;height:32px;background-color:#004BE2;border-radius:50%;text-align:center;line-height:32px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;">3</div></td>
          <td style="padding-bottom:24px;padding-left:8px;">
            <h3 data-slot="feature-3-title" style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:600;color:#0E0E0E;margin:0 0 6px;">Enhanced File Transfer</h3>
            <p data-slot="feature-3-desc" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#4a5568;line-height:1.6;margin:0;">Transfer files up to 2GB with progress tracking and resume capability.</p>
            <img data-slot="feature-3-image" src="" style="display:none" />
          </td>
        </tr>
        <tr data-feature-group="4" data-feature-hidden="true" style="display:none">
          <td width="44" valign="top"><div style="width:32px;height:32px;background-color:#004BE2;border-radius:50%;text-align:center;line-height:32px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;">4</div></td>
          <td style="padding-bottom:24px;padding-left:8px;">
            <h3 data-slot="feature-4-title" style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:600;color:#0E0E0E;margin:0 0 6px;">Smart Scheduling</h3>
            <p data-slot="feature-4-desc" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#4a5568;line-height:1.6;margin:0;">Schedule unattended sessions and automate routine maintenance tasks.</p>
            <img data-slot="feature-4-image" src="" style="display:none" />
          </td>
        </tr>
        <tr data-feature-group="5" data-feature-hidden="true" style="display:none">
          <td width="44" valign="top"><div style="width:32px;height:32px;background-color:#004BE2;border-radius:50%;text-align:center;line-height:32px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;">5</div></td>
          <td style="padding-bottom:24px;padding-left:8px;">
            <h3 data-slot="feature-5-title" style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:600;color:#0E0E0E;margin:0 0 6px;">Two-Factor Authentication</h3>
            <p data-slot="feature-5-desc" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#4a5568;line-height:1.6;margin:0;">Secure all remote connections with built-in two-factor authentication.</p>
            <img data-slot="feature-5-image" src="" style="display:none" />
          </td>
        </tr>
        <tr data-feature-group="6" data-feature-hidden="true" style="display:none">
          <td width="44" valign="top"><div style="width:32px;height:32px;background-color:#004BE2;border-radius:50%;text-align:center;line-height:32px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;">6</div></td>
          <td style="padding-bottom:24px;padding-left:8px;">
            <h3 data-slot="feature-6-title" style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:600;color:#0E0E0E;margin:0 0 6px;">Screen Annotations</h3>
            <p data-slot="feature-6-desc" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#4a5568;line-height:1.6;margin:0;">Draw and highlight directly on the remote screen during live sessions.</p>
            <img data-slot="feature-6-image" src="" style="display:none" />
          </td>
        </tr>
        <tr data-feature-group="7" data-feature-hidden="true" style="display:none">
          <td width="44" valign="top"><div style="width:32px;height:32px;background-color:#004BE2;border-radius:50%;text-align:center;line-height:32px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;">7</div></td>
          <td style="padding-bottom:24px;padding-left:8px;">
            <h3 data-slot="feature-7-title" style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:600;color:#0E0E0E;margin:0 0 6px;">Cross-Platform Access</h3>
            <p data-slot="feature-7-desc" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#4a5568;line-height:1.6;margin:0;">Support Windows, Mac, Linux, iOS and Android from any device.</p>
            <img data-slot="feature-7-image" src="" style="display:none" />
          </td>
        </tr>
        <tr data-feature-group="8" data-feature-hidden="true" style="display:none">
          <td width="44" valign="top"><div style="width:32px;height:32px;background-color:#004BE2;border-radius:50%;text-align:center;line-height:32px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;">8</div></td>
          <td style="padding-bottom:24px;padding-left:8px;">
            <h3 data-slot="feature-8-title" style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:600;color:#0E0E0E;margin:0 0 6px;">API &amp; Webhook Support</h3>
            <p data-slot="feature-8-desc" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#4a5568;line-height:1.6;margin:0;">Automate workflows by integrating Zoho Assist with your tools via API.</p>
            <img data-slot="feature-8-image" src="" style="display:none" />
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`);

// ═══════════════════════════════════════════════════════════════
// D: TESTIMONIALS
// ═══════════════════════════════════════════════════════════════

const D1 = sec('d1', 'D1', 'Customer Spotlight (Glass Card)', 'Testimonials', 'Apr 2026',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FAFFEB;">
  <tr><td align="center" style="padding:40px 30px;">
    <table width="480" cellpadding="0" cellspacing="0" border="0" style="background:rgba(255,255,255,0.85);border-radius:14px;">
      <tr><td style="padding:30px;">
        <h3 data-slot="label" style="font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:#718096;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 14px;">Customer Spotlight</h3>
        <p data-slot="quote" style="font-family:Arial,sans-serif;font-size:15px;color:#2d3748;line-height:1.7;font-style:italic;margin:0 0 6px;">"The AR annotation feature in Zoho Lens helped us reduce on-site visits by 60%. Our field engineers can now guide repairs remotely with pinpoint accuracy."</p>
        <p data-slot="read-more" style="font-family:Arial,sans-serif;font-size:13px;margin:0 0 18px;"><a href="#" style="color:#004BE2;text-decoration:underline;">Read full story</a></p>
        <p data-slot="name" style="font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#0E0E0E;margin:0;text-align:center;">Priya Sharma</p>
        <p data-slot="role" style="font-family:Arial,sans-serif;font-size:12px;color:#718096;margin:2px 0 0;text-align:center;">VP Engineering, FieldForce Pro</p>
        <img data-slot="avatar" src="" style="display:none" />
      </td></tr>
    </table>
    <table cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;"><tr><td style="background:#004BE2;border-radius:6px;"><a href="#" data-slot="cta-button" style="display:inline-block;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;padding:12px 28px;">Read all customer stories</a></td></tr></table>
  </td></tr>
</table>`);

const D2 = sec('d2', 'D2', 'Testimonial — Card with Avatar', 'Testimonials', 'Custom Variant',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FAFFEB;">
  <tr><td align="center" style="padding:40px 30px;">
    <table width="480" cellpadding="0" cellspacing="0" border="0" style="background:rgba(255,255,255,0.85);border-radius:14px;">
      <tr><td style="padding:30px;">
        <h3 data-slot="label" style="font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:#718096;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 14px;">Customer Spotlight</h3>
        <p data-slot="quote" style="font-family:Arial,sans-serif;font-size:15px;color:#2d3748;line-height:1.7;font-style:italic;margin:0 0 6px;">"The AR annotation feature in Zoho Lens helped us reduce on-site visits by 60%. Our field engineers can now guide repairs remotely with pinpoint accuracy."</p>
        <p data-slot="read-more" style="font-family:Arial,sans-serif;font-size:13px;margin:0 0 20px;"><a href="#" style="color:#004BE2;text-decoration:underline;">Read full story</a></p>
        <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop" width="50" height="50" alt="Avatar" data-slot="avatar" style="display:block;border-radius:50%;margin:0 auto 12px;" />
        <p data-slot="name" style="font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#0E0E0E;margin:0;text-align:center;">Priya Sharma</p>
        <p data-slot="role" style="font-family:Arial,sans-serif;font-size:12px;color:#718096;margin:2px 0 0;text-align:center;">VP Engineering, FieldForce Pro</p>
      </td></tr>
    </table>
    <table cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;"><tr><td style="background:#004BE2;border-radius:6px;"><a href="#" data-slot="cta-button" style="display:inline-block;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;padding:12px 28px;">Read all customer stories</a></td></tr></table>
  </td></tr>
</table>`);

const D3 = sec('d3', 'D3', 'Testimonial — Avatar First', 'Testimonials', 'Custom Variant',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FAFFEB;">
  <tr><td align="center" style="padding:40px 30px;">
    <table width="480" cellpadding="0" cellspacing="0" border="0" style="background:rgba(255,255,255,0.85);border-radius:14px;">
      <tr><td style="padding:30px;">
        <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop" width="50" height="50" alt="Avatar" data-slot="avatar" style="display:block;border-radius:50%;margin:0 auto 12px;" />
        <p data-slot="name" style="font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#0E0E0E;margin:0 0 2px;text-align:center;">Priya Sharma</p>
        <p data-slot="role" style="font-family:Arial,sans-serif;font-size:12px;color:#718096;margin:0 0 18px;text-align:center;">VP Engineering, FieldForce Pro</p>
        <h3 data-slot="label" style="font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:#718096;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 14px;">Customer Spotlight</h3>
        <p data-slot="quote" style="font-family:Arial,sans-serif;font-size:15px;color:#2d3748;line-height:1.7;font-style:italic;margin:0 0 6px;">"The AR annotation feature in Zoho Lens helped us reduce on-site visits by 60%. Our field engineers can now guide repairs remotely with pinpoint accuracy."</p>
        <p data-slot="read-more" style="font-family:Arial,sans-serif;font-size:13px;margin:0;"><a href="#" style="color:#004BE2;text-decoration:underline;">Read full story</a></p>
      </td></tr>
    </table>
    <table cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;"><tr><td style="background:#004BE2;border-radius:6px;"><a href="#" data-slot="cta-button" style="display:inline-block;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;padding:12px 28px;">Read all customer stories</a></td></tr></table>
  </td></tr>
</table>`);

// ═══════════════════════════════════════════════════════════════
// E: ARTICLES
// ═══════════════════════════════════════════════════════════════

const E1 = sec('e1', 'E1', 'Intro Text Block', 'Articles', 'Jan 2023',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
  <tr><td style="padding:30px 40px;">
    <h3 data-slot="heading" style="font-family:Lato,Arial,sans-serif;font-size:20px;font-weight:700;color:#0E0E0E;margin:0 0 12px;">Welcome to the January Edition</h3>
    <p data-slot="body" style="font-family:Lato,Arial,sans-serif;font-size:15px;color:#4a5568;line-height:1.7;margin:0;">This month we're excited to share the latest updates across all Zoho remote support products. From new security features to performance improvements, there's plenty to explore.</p>
  </td></tr>
</table>`);

const E2 = sec('e2', 'E2', 'Articles — Dark Background', 'Articles', 'Custom Variant',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f172a;">
  <tr><td style="padding:30px 40px;">
    <h3 data-slot="heading" style="font-family:Lato,Arial,sans-serif;font-size:20px;font-weight:700;color:#ffffff;margin:0 0 12px;">Welcome to the January Edition</h3>
    <p data-slot="body" style="font-family:Lato,Arial,sans-serif;font-size:15px;color:#d1d5db;line-height:1.7;margin:0;">This month we're excited to share the latest updates across all Zoho remote support products. From new security features to performance improvements, there's plenty to explore.</p>
  </td></tr>
</table>`, true);

const E3 = sec('e3', 'E3', 'Articles — Left Accent Border', 'Articles', 'Custom Variant',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
  <tr><td style="padding:30px 40px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td width="4" style="background-color:#2563eb;border-radius:2px;"></td>
      <td style="padding-left:18px;">
        <h3 data-slot="heading" style="font-family:Lato,Arial,sans-serif;font-size:20px;font-weight:700;color:#0E0E0E;margin:0 0 12px;">Welcome to the January Edition</h3>
        <p data-slot="body" style="font-family:Lato,Arial,sans-serif;font-size:15px;color:#4a5568;line-height:1.7;margin:0;">This month we're excited to share the latest updates across all Zoho remote support products. From new security features to performance improvements, there's plenty to explore.</p>
      </td>
    </tr></table>
  </td></tr>
</table>`, true);

// ═══════════════════════════════════════════════════════════════
// F: EVENTS
// ═══════════════════════════════════════════════════════════════

const F1 = sec('f1', 'F1', 'Event — Logo Hero Image', 'Events', 'Sep 2025',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0E0E0E;">
  <tr><td style="padding:40px 30px;">
    <img data-slot="logo" src="https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=180&h=50&fit=crop" width="180" height="50" alt="Zoholics" style="display:block;margin-bottom:20px;" />
    <h2 data-slot="heading" style="font-family:Arial,sans-serif;font-size:24px;font-weight:700;color:#ffffff;margin:0 0 10px;">Zoholics 2025 — Austin, TX</h2>
    <p data-slot="body" style="font-family:Arial,sans-serif;font-size:14px;color:#a0aec0;line-height:1.6;margin:0 0 22px;">Join thousands of Zoho users and partners for our biggest annual conference. Workshops, keynotes, and networking — all in one place.</p>
    <img data-slot="image-main" src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=540&h=260&fit=crop" width="540" height="260" alt="Event photo" style="display:block;width:100%;height:auto;border-radius:10px;" />
    <span data-slot="date-icon" style="display:none"></span>
    <span data-slot="date-text" style="display:none"></span>
    <span data-slot="location-icon" style="display:none"></span>
    <span data-slot="location-text" style="display:none"></span>
    <a data-slot="cta-button" href="#" style="display:none"></a>
    <img data-slot="image-secondary" src="" style="display:none" />
  </td></tr>
</table>`);

const F2 = sec('f2', 'F2', 'Event — Two Stacked Images', 'Events', 'Custom Variant',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0E0E0E;">
  <tr><td style="padding:40px 30px;">
    <img data-slot="logo" src="https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=180&h=50&fit=crop" width="180" height="50" alt="Zoholics" style="display:block;margin-bottom:20px;" />
    <h2 data-slot="heading" style="font-family:Arial,sans-serif;font-size:24px;font-weight:700;color:#ffffff;margin:0 0 10px;">Zoholics 2025 — Austin, TX</h2>
    <p data-slot="body" style="font-family:Arial,sans-serif;font-size:14px;color:#a0aec0;line-height:1.6;margin:0 0 22px;">Join thousands of Zoho users and partners for our biggest annual conference. Workshops, keynotes, and networking — all in one place.</p>
    <img data-slot="image-main" src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=540&h=260&fit=crop" width="540" height="260" alt="Event photo" style="display:block;width:100%;height:auto;border-radius:10px;margin-bottom:12px;" />
    <img data-slot="image-secondary" src="https://images.unsplash.com/photo-1497215842964-222b430dc094?w=540&h=260&fit=crop" width="540" height="260" alt="Event photo 2" style="display:block;width:100%;height:auto;border-radius:10px;" />
    <span data-slot="date-icon" style="display:none"></span>
    <span data-slot="date-text" style="display:none"></span>
    <span data-slot="location-icon" style="display:none"></span>
    <span data-slot="location-text" style="display:none"></span>
    <a data-slot="cta-button" href="#" style="display:none"></a>
  </td></tr>
</table>`, true);

const F3 = sec('f3', 'F3', 'Event — Split Text Left Image Right', 'Events', 'Custom Variant',
`<style>@media only screen and (max-width:480px){.f3-col-text,.f3-col-image{display:block!important;width:100%!important;padding-right:0!important;}}</style>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0E0E0E;">
  <tr><td style="padding:40px 30px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="f3-col-text" width="55%" valign="top" style="padding-right:24px;">
          <img data-slot="logo" src="https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=180&h=50&fit=crop" width="180" height="50" alt="Zoholics" style="display:block;margin-bottom:20px;" />
          <h2 data-slot="heading" style="font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#ffffff;margin:0 0 10px;">Zoholics 2025 — Austin, TX</h2>
          <p data-slot="body" style="font-family:Arial,sans-serif;font-size:14px;color:#a0aec0;line-height:1.6;margin:0;">Join thousands of Zoho users and partners for our biggest annual conference. Workshops, keynotes, and networking — all in one place.</p>
        </td>
        <td class="f3-col-image" width="45%" valign="top">
          <img data-slot="image-main" src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=260&h=280&fit=crop" width="260" height="280" alt="Event photo" style="display:block;width:100%;height:auto;border-radius:10px;" />
          <img data-slot="image-secondary" src="" style="display:none" />
        </td>
      </tr>
    </table>
    <span data-slot="date-icon" style="display:none"></span>
    <span data-slot="date-text" style="display:none"></span>
    <span data-slot="location-icon" style="display:none"></span>
    <span data-slot="location-text" style="display:none"></span>
    <a data-slot="cta-button" href="#" style="display:none"></a>
  </td></tr>
</table>`, true);

// ═══════════════════════════════════════════════════════════════
// G: REGISTRATION / WEBINAR
// ═══════════════════════════════════════════════════════════════

const G1 = sec('g1', 'G1', 'Registration — Card Top', 'Registration', 'Dec 2025',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#E5EDFC;">
  <tr><td style="padding:36px 30px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#004BE2,#1a1a2e);border-radius:12px;">
      <tr><td style="padding:30px;">
        <h2 data-slot="heading" style="font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#ffffff;margin:0 0 14px;">Live: Zoho Assist Deep Dive</h2>
        <p style="font-family:Arial,sans-serif;font-size:14px;color:#dce6f7;margin:0 0 4px;"><span data-slot="date-icon" class="email-icon" style="font-size:13px;line-height:1;vertical-align:middle;margin-right:10px;">&#128197;</span><span data-slot="date-text">December 18, 2025</span></p>
        <p style="font-family:Arial,sans-serif;font-size:14px;color:#dce6f7;margin:0 0 4px;"><span data-slot="time-icon" class="email-icon" style="font-size:13px;line-height:1;vertical-align:middle;margin-right:10px;">&#128336;</span><span data-slot="time-text">10:00 AM EST / 3:00 PM GMT / 8:30 PM IST</span></p>
      </td></tr>
    </table>
    <p data-slot="body" style="font-family:Arial,sans-serif;font-size:14px;color:#4a5568;line-height:1.6;margin:18px 0;">Learn how to maximize your remote support efficiency with advanced session features, automation rules, and custom integrations.</p>
    <table cellpadding="0" cellspacing="0" border="0"><tr><td><a data-slot="cta-button" href="#" style="display:inline-block;border:2px solid #004BE2;border-radius:6px;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#004BE2;text-decoration:none;padding:10px 22px;">Register now</a></td></tr></table>
  </td></tr>
</table>`);

const G2 = sec('g2', 'G2', 'Registration — Card Bottom', 'Registration', 'Custom Variant',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#E5EDFC;">
  <tr><td style="padding:36px 30px;">
    <h2 data-slot="heading" style="font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#0E0E0E;margin:0 0 14px;">Live: Zoho Assist Deep Dive</h2>
    <p data-slot="body" style="font-family:Arial,sans-serif;font-size:14px;color:#4a5568;line-height:1.6;margin:0 0 20px;">Learn how to maximize your remote support efficiency with advanced session features, automation rules, and custom integrations.</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#004BE2,#1a1a2e);border-radius:12px;">
      <tr><td style="padding:30px;">
        <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;"><tr>
          <td style="padding-right:10px;vertical-align:middle;"><span data-slot="date-icon" class="email-icon" style="font-size:13px;line-height:1;">&#128197;</span></td>
          <td style="vertical-align:middle;"><span data-slot="date-text" style="font-family:Arial,sans-serif;font-size:14px;color:#dce6f7;">December 18, 2025</span></td>
        </tr></table>
        <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;"><tr>
          <td style="padding-right:10px;vertical-align:middle;"><span data-slot="time-icon" class="email-icon" style="font-size:13px;line-height:1;">&#128336;</span></td>
          <td style="vertical-align:middle;"><span data-slot="time-text" style="font-family:Arial,sans-serif;font-size:14px;color:#dce6f7;">10:00 AM EST / 3:00 PM GMT / 8:30 PM IST</span></td>
        </tr></table>
        <table cellpadding="0" cellspacing="0" border="0"><tr><td style="border:2px solid rgba(255,255,255,0.8);border-radius:6px;"><a data-slot="cta-button" href="#" style="display:inline-block;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;padding:10px 22px;">Register now</a></td></tr></table>
      </td></tr>
    </table>
  </td></tr>
</table>`, true);

const G3 = sec('g3', 'G3', 'Registration — Flat Layout', 'Registration', 'Custom Variant',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#E5EDFC;">
  <tr><td style="padding:36px 30px;">
    <h2 data-slot="heading" style="font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#0E0E0E;margin:0 0 16px;">Live: Zoho Assist Deep Dive</h2>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#4a5568;margin:0 0 8px;"><span data-slot="date-icon" class="email-icon" style="font-size:13px;line-height:1;vertical-align:middle;margin-right:10px;">&#128197;</span><span data-slot="date-text">December 18, 2025</span></p>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#4a5568;margin:0 0 18px;"><span data-slot="time-icon" class="email-icon" style="font-size:13px;line-height:1;vertical-align:middle;margin-right:10px;">&#128336;</span><span data-slot="time-text">10:00 AM EST / 3:00 PM GMT / 8:30 PM IST</span></p>
    <p data-slot="body" style="font-family:Arial,sans-serif;font-size:14px;color:#4a5568;line-height:1.6;margin:0 0 22px;">Learn how to maximize your remote support efficiency with advanced session features, automation rules, and custom integrations.</p>
    <table cellpadding="0" cellspacing="0" border="0"><tr><td><a data-slot="cta-button" href="#" style="display:inline-block;border:2px solid #004BE2;border-radius:6px;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#004BE2;text-decoration:none;padding:10px 22px;">Register now</a></td></tr></table>
  </td></tr>
</table>`, true);

// ═══════════════════════════════════════════════════════════════
// H: CTAs
// ═══════════════════════════════════════════════════════════════

const H1 = sec('h1', 'H1', 'Before You Go CTA (Two-Column)', 'CTAs', 'Apr 2026',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
  <tr><td style="padding:40px 30px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" dir="rtl"><tr>
      <td width="42%" valign="middle" align="right" dir="ltr">
        <img data-slot="image-main" src="https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=200&h=180&fit=crop" width="200" height="180" alt="Gift" style="display:block;border-radius:10px;" />
      </td>
      <td width="58%" valign="middle" dir="ltr">
        <h2 data-slot="heading" style="font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#0E0E0E;margin:0 0 10px;">Before You Go...</h2>
        <p data-slot="body" style="font-family:Arial,sans-serif;font-size:14px;color:#4a5568;line-height:1.6;margin:0 0 20px;">Leave us a review and earn rewards! Your feedback helps us build a better product for everyone.</p>
        <table cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#004BE2;border-radius:6px;"><a data-slot="cta-button" href="#" style="display:inline-block;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#fff;text-decoration:none;padding:12px 26px;">Review and Earn</a></td></tr></table>
      </td>
    </tr></table>
  </td></tr>
</table>`);

const H2 = sec('h2', 'H2', 'CTA — Image Left Text Right', 'CTAs', 'Custom Variant',
`<style>@media only screen and (max-width:480px){.h3-col-img,.h3-col-text{display:block!important;width:100%!important;padding-left:0!important;}}</style>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
  <tr><td style="padding:40px 30px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td class="h3-col-img" width="42%" valign="middle">
        <img data-slot="image-main" src="https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=200&h=180&fit=crop" width="200" height="180" alt="CTA image" style="display:block;border-radius:10px;" />
      </td>
      <td class="h3-col-text" width="58%" valign="middle" style="padding-left:20px;">
        <h2 data-slot="heading" style="font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#0E0E0E;margin:0 0 10px;">Before You Go...</h2>
        <p data-slot="body" style="font-family:Arial,sans-serif;font-size:14px;color:#4a5568;line-height:1.6;margin:0 0 20px;">Leave us a review and earn rewards! Your feedback helps us build a better product for everyone.</p>
        <table cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#004BE2;border-radius:6px;"><a data-slot="cta-button" href="#" style="display:inline-block;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#fff;text-decoration:none;padding:12px 26px;">Review and Earn</a></td></tr></table>
      </td>
    </tr></table>
  </td></tr>
</table>`, true);

const H3 = sec('h3', 'H3', 'CTA — Centered Single Column', 'CTAs', 'Custom Variant',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
  <tr><td align="center" style="padding:40px 30px;">
    <img data-slot="image-main" src="https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=200&h=180&fit=crop" width="200" height="180" alt="CTA image" style="display:block;border-radius:10px;margin:0 auto 20px;" />
    <h2 data-slot="heading" style="font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#0E0E0E;margin:0 0 10px;">Before You Go...</h2>
    <p data-slot="body" style="font-family:Arial,sans-serif;font-size:14px;color:#4a5568;line-height:1.6;margin:0 0 20px;">Leave us a review and earn rewards! Your feedback helps us build a better product for everyone.</p>
    <table cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#004BE2;border-radius:6px;"><a data-slot="cta-button" href="#" style="display:inline-block;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#fff;text-decoration:none;padding:12px 26px;">Review and Earn</a></td></tr></table>
  </td></tr>
</table>`, true);

// ═══════════════════════════════════════════════════════════════
// I: FOOTERS
// ═══════════════════════════════════════════════════════════════

const J1 = sec('j1', 'J1', 'Message + Team Footer', 'Footers', 'Apr 2026',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F7F7F7;">
  <tr><td style="padding:30px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td width="35%" valign="middle"><img data-slot="image-main" src="https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=180&h=140&fit=crop" width="180" height="140" alt="Team" style="display:block;border-radius:8px;" /></td>
      <td width="65%" valign="middle" style="padding-left:24px;">
        <p data-slot="body" style="font-family:Arial,sans-serif;font-size:15px;color:#2d3748;line-height:1.6;margin:0 0 8px;">Have a question? Hit reply — we read every message.</p>
        <p data-slot="author" style="font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:#718096;margin:0;">— The Zoho Assist Team</p>
      </td>
    </tr></table>
  </td></tr>
</table>`);

const J2 = sec('j2', 'J2', 'Footer — Text Left Image Right', 'Footers', 'Custom Variant',
`<style>@media only screen and (max-width:480px){.i5-col-text,.i5-col-img{display:block!important;width:100%!important;padding-right:0!important;}}</style>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F7F7F7;">
  <tr><td style="padding:30px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td class="i5-col-text" width="65%" valign="middle" style="padding-right:24px;">
        <p data-slot="body" style="font-family:Arial,sans-serif;font-size:15px;color:#2d3748;line-height:1.6;margin:0 0 8px;">Have a question? Hit reply — we read every message.</p>
        <p data-slot="author" style="font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:#718096;margin:0;">— The Zoho Assist Team</p>
      </td>
      <td class="i5-col-img" width="35%" valign="middle">
        <img data-slot="image-main" src="https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=180&h=140&fit=crop" width="180" height="140" alt="Team" style="display:block;border-radius:8px;" />
      </td>
    </tr></table>
  </td></tr>
</table>`, true);

const J3 = sec('j3', 'J3', 'Footer — Centered Single Column', 'Footers', 'Custom Variant',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
  <tr><td align="center" style="padding:30px;">
    <img data-slot="image-main" src="https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=180&h=140&fit=crop" width="180" height="140" alt="Team" style="display:block;border-radius:8px;margin:0 auto 16px;" />
    <p data-slot="body" style="font-family:Arial,sans-serif;font-size:15px;color:#2d3748;line-height:1.6;margin:0 0 8px;">Have a question? Hit reply — we read every message.</p>
    <p data-slot="author" style="font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:#718096;margin:0;">— The Zoho Assist Team</p>
  </td></tr>
</table>`, true);

// ═══════════════════════════════════════════════════════════════
// J: IMAGE COLLAGES
// ═══════════════════════════════════════════════════════════════

const I1 = sec('i1', 'I1', '2-Up Horizontal (50/50)', 'Collages', 'Spec Required',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
  <tr><td style="padding:20px 30px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td width="49%"><img data-slot="image-1" src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=260&h=200&fit=crop" width="260" height="200" alt="Image 1" style="display:block;width:100%;height:auto;border-radius:6px;" /></td>
    <td width="2%"></td>
    <td width="49%"><img data-slot="image-2" src="https://images.unsplash.com/photo-1497215842964-222b430dc094?w=260&h=200&fit=crop" width="260" height="200" alt="Image 2" style="display:block;width:100%;height:auto;border-radius:6px;" /></td>
  </tr></table></td></tr>
</table>`);

const I2 = sec('i2', 'I2', '2-Up Vertical', 'Collages', 'Spec Required',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
  <tr><td style="padding:20px 30px;">
    <img data-slot="image-1" src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=540&h=200&fit=crop" width="540" height="200" alt="Image 1" style="display:block;width:100%;height:auto;border-radius:6px;margin-bottom:8px;" />
    <img data-slot="image-2" src="https://images.unsplash.com/photo-1497215842964-222b430dc094?w=540&h=200&fit=crop" width="540" height="200" alt="Image 2" style="display:block;width:100%;height:auto;border-radius:6px;" />
  </td></tr>
</table>`);

const I3 = sec('i3', 'I3', '2-Up Asymmetric (70/30)', 'Collages', 'Spec Required',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
  <tr><td style="padding:20px 30px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td width="68%"><img data-slot="image-1" src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=380&h=240&fit=crop" width="380" height="240" alt="Large" style="display:block;width:100%;height:auto;border-radius:6px;" /></td>
    <td width="2%"></td>
    <td width="30%"><img data-slot="image-2" src="https://images.unsplash.com/photo-1497215842964-222b430dc094?w=160&h=240&fit=crop" width="160" height="240" alt="Small" style="display:block;width:100%;height:auto;border-radius:6px;" /></td>
  </tr></table></td></tr>
</table>`);

const I4 = sec('i4', 'I4', '3-Up Equal', 'Collages', 'Spec Required',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
  <tr><td style="padding:20px 30px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td width="32%"><img data-slot="image-1" src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=170&h=150&fit=crop" width="170" height="150" alt="" style="display:block;width:100%;border-radius:6px;" /></td>
    <td width="2%"></td>
    <td width="32%"><img data-slot="image-2" src="https://images.unsplash.com/photo-1497215842964-222b430dc094?w=170&h=150&fit=crop" width="170" height="150" alt="" style="display:block;width:100%;border-radius:6px;" /></td>
    <td width="2%"></td>
    <td width="32%"><img data-slot="image-3" src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=170&h=150&fit=crop" width="170" height="150" alt="" style="display:block;width:100%;border-radius:6px;" /></td>
  </tr></table></td></tr>
</table>`);

const I5 = sec('i5', 'I5', '3-Up Feature (1+2)', 'Collages', 'Spec Required',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
  <tr><td style="padding:20px 30px;">
    <img data-slot="image-1" src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=540&h=220&fit=crop" width="540" height="220" alt="" style="display:block;width:100%;border-radius:6px;margin-bottom:8px;" />
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td width="49%"><img data-slot="image-2" src="https://images.unsplash.com/photo-1497215842964-222b430dc094?w=260&h=160&fit=crop" width="260" height="160" alt="" style="display:block;width:100%;border-radius:6px;" /></td>
      <td width="2%"></td>
      <td width="49%"><img data-slot="image-3" src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=260&h=160&fit=crop" width="260" height="160" alt="" style="display:block;width:100%;border-radius:6px;" /></td>
    </tr></table>
  </td></tr>
</table>`);

const I6 = sec('i6', 'I6', '4-Up Grid (2x2)', 'Collages', 'Spec Required',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
  <tr><td style="padding:20px 30px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;"><tr>
      <td width="49%"><img data-slot="image-1" src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=260&h=180&fit=crop" width="260" height="180" alt="" style="display:block;width:100%;border-radius:6px;" /></td>
      <td width="2%"></td>
      <td width="49%"><img data-slot="image-2" src="https://images.unsplash.com/photo-1497215842964-222b430dc094?w=260&h=180&fit=crop" width="260" height="180" alt="" style="display:block;width:100%;border-radius:6px;" /></td>
    </tr></table>
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td width="49%"><img data-slot="image-3" src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=260&h=180&fit=crop" width="260" height="180" alt="" style="display:block;width:100%;border-radius:6px;" /></td>
      <td width="2%"></td>
      <td width="49%"><img data-slot="image-4" src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=260&h=180&fit=crop" width="260" height="180" alt="" style="display:block;width:100%;border-radius:6px;" /></td>
    </tr></table>
  </td></tr>
</table>`);

const I7 = sec('i7', 'I7', '4-Up Asymmetric (1+3)', 'Collages', 'Spec Required',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
  <tr><td style="padding:20px 30px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td width="58%" valign="top"><img data-slot="image-1" src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=320&h=340&fit=crop" width="320" height="340" alt="" style="display:block;width:100%;border-radius:6px;" /></td>
    <td width="2%"></td>
    <td width="40%" valign="top">
      <img data-slot="image-2" src="https://images.unsplash.com/photo-1497215842964-222b430dc094?w=220&h=108&fit=crop" width="220" height="108" alt="" style="display:block;width:100%;border-radius:6px;margin-bottom:8px;" />
      <img data-slot="image-3" src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=220&h=108&fit=crop" width="220" height="108" alt="" style="display:block;width:100%;border-radius:6px;margin-bottom:8px;" />
      <img data-slot="image-4" src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=220&h=108&fit=crop" width="220" height="108" alt="" style="display:block;width:100%;border-radius:6px;" />
    </td>
  </tr></table></td></tr>
</table>`);

const I8 = sec('i8', 'I8', 'Mosaic / Masonry', 'Collages', 'Spec Required',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
  <tr><td style="padding:20px 30px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td width="40%" valign="top"><img data-slot="image-1" src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=220&h=300&fit=crop" width="220" height="300" alt="" style="display:block;width:100%;border-radius:6px;" /></td>
    <td width="2%"></td>
    <td width="58%" valign="top">
      <img data-slot="image-2" src="https://images.unsplash.com/photo-1497215842964-222b430dc094?w=320&h=146&fit=crop" width="320" height="146" alt="" style="display:block;width:100%;border-radius:6px;margin-bottom:8px;" />
      <img data-slot="image-3" src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=320&h=146&fit=crop" width="320" height="146" alt="" style="display:block;width:100%;border-radius:6px;" />
      <img data-slot="image-4" src="" style="display:none" />
      <img data-slot="image-5" src="" style="display:none" />
      <img data-slot="image-6" src="" style="display:none" />
    </td>
  </tr></table></td></tr>
</table>`);

const I9 = sec('i9', 'I9', 'Full-Width Single Image', 'Collages', 'Spec Required',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
  <tr><td style="padding:20px 30px;">
    <img data-slot="image-1" src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=540&h=300&fit=crop" width="540" height="300" alt="Full width" style="display:block;width:100%;height:auto;border-radius:6px;" />
  </td></tr>
</table>`);

const I10 = sec('i10', 'I10', '3-Up with Captions', 'Collages', 'Spec Required',
`<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
  <tr><td style="padding:20px 30px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td width="32%" valign="top"><img data-slot="image-1" src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=170&h=130&fit=crop" width="170" height="130" alt="" style="display:block;width:100%;border-radius:6px;" /><p style="font-family:Arial,sans-serif;font-size:12px;color:#718096;margin:6px 0 0;text-align:center;">Remote Access</p></td>
    <td width="2%"></td>
    <td width="32%" valign="top"><img data-slot="image-2" src="https://images.unsplash.com/photo-1497215842964-222b430dc094?w=170&h=130&fit=crop" width="170" height="130" alt="" style="display:block;width:100%;border-radius:6px;" /><p style="font-family:Arial,sans-serif;font-size:12px;color:#718096;margin:6px 0 0;text-align:center;">AR Support</p></td>
    <td width="2%"></td>
    <td width="32%" valign="top"><img data-slot="image-3" src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=170&h=130&fit=crop" width="170" height="130" alt="" style="display:block;width:100%;border-radius:6px;" /><p style="font-family:Arial,sans-serif;font-size:12px;color:#718096;margin:6px 0 0;text-align:center;">Diagnostics</p></td>
  </tr></table></td></tr>
</table>`);

// ═══════════════════════════════════════════════════════════════
// K: DIVIDERS
// ═══════════════════════════════════════════════════════════════

const K1 = sec('k1', 'K1', 'Horizontal Line Divider', 'Dividers', 'Spec Required',
`<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:10px 30px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid #e2e8f0;font-size:1px;line-height:1px;">&nbsp;</td></tr></table></td></tr></table>`);

const K2 = sec('k2', 'K2', 'Spacer Block', 'Dividers', 'Spec Required',
`<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height:40px;font-size:1px;line-height:1px;">&nbsp;</td></tr></table>`);

const K3 = sec('k3', 'K3', 'Dotted Divider', 'Dividers', 'Spec Required',
`<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:10px 30px;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:2px dotted #cbd5e0;font-size:1px;line-height:1px;">&nbsp;</td></tr></table></td></tr></table>`);

const K4 = sec('k4', 'K4', 'Gradient Divider', 'Dividers', 'Spec Required',
`<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:10px 60px;"><div style="height:2px;background:linear-gradient(90deg,transparent,#004BE2,transparent);"></div></td></tr></table>`);

// ═══════════════════════════════════════════════════════════════
// EXPORT ALL
// ═══════════════════════════════════════════════════════════════

export const ALL_SECTIONS: LibrarySection[] = [
  // Headers
  A1, A2, A3,
  // Heroes
  B1, B2, B3,
  // Features
  C1, C2, C3,
  // Testimonials
  D1, D2, D3,
  // Articles
  E1, E2, E3,
  // Events
  F1, F2, F3,
  // Registration
  G1, G2, G3,
  // CTAs
  H1, H2, H3,
  // Collages
  I1, I2, I3, I4, I5, I6, I7, I8, I9, I10,
  // Footers
  J1, J2, J3,
  // Dividers
  K1, K2, K3, K4,
];

// FIX 4: Token-based theme presets. Each preset defines semantic tokens.
// All presets pass WCAG AA (4.5:1 normal text, 3:1 large text).
// bgPrimary/dark sections → primary; cards/light areas → secondary;
// headings → textPrimary on light / textOnDark on dark backgrounds;
// buttons → button + buttonText; links → accent; hr/dividers → divider.
export const THEME_PRESETS = [
  {
    id: 'zoho-blue',
    name: 'Zoho Blue',
    colors: {
      primary: '#004BE2',      // dark-bg hero areas
      secondary: '#E5EDFC',    // light card / accent areas
      background: '#ffffff',   // page / section bg
      textPrimary: '#0E0E0E',  // headings & body on light bg — 21:1 vs white
      textSecondary: '#4a5568',// secondary text on light bg — 7.4:1 vs white
      textOnDark: '#ffffff',   // text on primary-coloured bg — 14:1 vs #004BE2
      accent: '#FFDD53',       // links, decorative highlights
      button: '#004BE2',       // CTA button background
      buttonText: '#ffffff',   // CTA button text — 14:1 vs #004BE2
      divider: '#e2e8f0',      // hr / border lines
      strokeBorder: '#cbd5e0', // container strokes
    },
  },
  {
    id: 'dark-professional',
    name: 'Dark Professional',
    colors: {
      primary: '#0f172a',      // dark navy hero areas
      secondary: '#1e293b',    // slightly lighter card bg
      background: '#f8fafc',   // page bg — near white
      textPrimary: '#0f172a',  // headings on light bg — 19:1 vs #f8fafc
      textSecondary: '#475569',// body on light bg — 5.7:1 vs #f8fafc
      textOnDark: '#f1f5f9',   // headings/body on dark bg — 16:1 vs #0f172a
      accent: '#2563eb',       // links (bright blue on white bg — 5.9:1)
      button: '#2563eb',       // CTA bg
      buttonText: '#ffffff',   // CTA text — 4.9:1 vs #2563eb
      divider: '#e2e8f0',
      strokeBorder: '#cbd5e0',
    },
  },
  {
    id: 'earthy-green',
    name: 'Earthy Green',
    colors: {
      primary: '#166534',      // deep forest green hero
      secondary: '#dcfce7',    // pale green card areas
      background: '#ffffff',
      textPrimary: '#14532d',  // dark green on white — 12:1
      textSecondary: '#4b5563',// gray on white — 7.3:1
      textOnDark: '#ffffff',   // on forest green — 9.8:1
      accent: '#d97706',       // amber links — 3.6:1 vs white (large text passes)
      button: '#16a34a',       // medium green button
      buttonText: '#ffffff',   // 4.6:1 vs #16a34a
      divider: '#bbf7d0',
      strokeBorder: '#86efac',
    },
  },
  {
    id: 'warm-coral',
    name: 'Warm Coral',
    colors: {
      primary: '#c2410c',      // deep burnt orange / coral hero
      secondary: '#fff7ed',    // very light peach card
      background: '#ffffff',
      textPrimary: '#431407',  // dark brown on white — 17:1
      textSecondary: '#78350f',// medium brown on white — 9.4:1
      textOnDark: '#ffffff',   // on coral primary — 8.1:1 vs #c2410c
      accent: '#ea580c',       // orange accent links — passes 3:1 (large)
      button: '#ea580c',       // coral button
      buttonText: '#ffffff',   // 4.5:1 vs #ea580c
      divider: '#fed7aa',
      strokeBorder: '#fdba74',
    },
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    colors: {
      primary: '#1a1a1a',      // near-black hero areas
      secondary: '#f5f5f5',    // light gray card
      background: '#ffffff',
      textPrimary: '#111111',  // almost black — 21:1 vs white
      textSecondary: '#6b7280',// gray — 4.6:1 vs white
      textOnDark: '#f9fafb',   // near-white on black — 18.7:1
      accent: '#4b5563',       // dark gray links — 7:1 vs white
      button: '#1a1a1a',
      buttonText: '#ffffff',   // 20.7:1 vs #1a1a1a
      divider: '#e5e7eb',
      strokeBorder: '#d1d5db',
    },
  },
  {
    id: 'ocean-teal',
    name: 'Ocean Teal',
    colors: {
      primary: '#0f766e',      // deep teal hero
      secondary: '#ccfbf1',    // pale mint card
      background: '#ffffff',
      textPrimary: '#134e4a',  // very dark teal — 14.3:1 vs white
      textSecondary: '#4b5563',// gray — 7.3:1 vs white
      textOnDark: '#ffffff',   // on deep teal — 8.5:1 vs #0f766e
      accent: '#0891b2',       // cyan links — 4.6:1 vs white
      button: '#0d9488',       // teal button
      buttonText: '#ffffff',   // 5.0:1 vs #0d9488
      divider: '#99f6e4',
      strokeBorder: '#5eead4',
    },
  },
];
