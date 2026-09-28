import type { CSSProperties } from 'react';
import { TEAM, type TeamMember } from '../../data/team';
import Picture from '../../components/Picture';

function ContactLines({ member }: { member: TeamMember }) {
  if (!member.phone && !member.email) return null;
  return (
    <p className="team__contact">
      {member.phone && <a href={`tel:${member.phone.replace(/\s+/g, '')}`}>{member.phone}</a>}
      {member.email && <a href={`mailto:${member.email}`}>{member.email}</a>}
    </p>
  );
}

function TeamCard({ member }: { member: TeamMember }) {
  return (
    <div className="team__card">
      <div className="team__portrait">
        <Picture
          photo={member.photo}
          alt={member.photoAlt}
          style={member.focalPoint ? { objectPosition: member.focalPoint } : undefined}
        />
      </div>
      <h3 className="h-3">{member.name}</h3>
      <p className="team__role">{member.role}</p>
      {member.bio && <p className="team__bio">{member.bio}</p>}
      <ContactLines member={member} />
    </div>
  );
}

function TeamLeader({ member }: { member: TeamMember }) {
  return (
    <div className="team__leader">
      <div className="team__leader-portrait">
        <Picture
          photo={member.photo}
          alt={member.photoAlt}
          style={member.focalPoint ? { objectPosition: member.focalPoint } : undefined}
        />
      </div>
      <div className="team__leader-body">
        <h3 className="h-3">{member.name}</h3>
        <p className="team__role">{member.role}</p>
        {member.bio && <p className="team__bio">{member.bio}</p>}
        <ContactLines member={member} />
      </div>
    </div>
  );
}

// One or two people read better as wide spotlight cards than as a grid
// row with empty trailing tiles (see docs/team-photos-and-bios.md), so
// small groups use the leader layout and larger ones a grid sized to fit.
function TeamGroupBlock({ label, members }: { label: string; members: TeamMember[] }) {
  if (members.length === 0) return null;
  return (
    <div className="team__group">
      <h3 className="team__group-label">{label}</h3>
      {members.length <= 2 ? (
        <div className="team__leaders">
          {members.map((member) => (
            <TeamLeader member={member} key={member.name} />
          ))}
        </div>
      ) : (
        <div className="team__grid" style={{ '--team-cols': Math.min(members.length, 4) } as CSSProperties}>
          {members.map((member) => (
            <TeamCard member={member} key={member.name} />
          ))}
        </div>
      )}
    </div>
  );
}

interface TeamProps {
  /** Defaults to the whole team (homepage). Office pages pass their own. */
  members?: TeamMember[];
  heading?: string;
  lede?: string;
}

export default function Team({
  members = TEAM,
  heading = 'Know who’s looking after your property.',
  lede = 'A named property manager you can reach directly.',
}: TeamProps) {
  const propertyManagers = members.filter((m) => m.groups.includes('property-management'));
  const leadership = members.filter((m) => m.groups.includes('leadership'));

  return (
    <section id="team" className="section section-paper team">
      <div className="wrap">
        <div className="team__head">
          <span className="eyebrow">Meet the team</span>
          <h2 className="h-1">{heading}</h2>
          <p className="lede">{lede}</p>
        </div>

        <TeamGroupBlock label="Property Management" members={propertyManagers} />
        <TeamGroupBlock label="Leadership / Sales" members={leadership} />

        <div className="team__cta">
          <a href="#appraisal" className="btn btn-outline-dark">
            Get My Free Rental Appraisal
          </a>
        </div>
      </div>
    </section>
  );
}
