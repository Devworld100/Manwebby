/* Shared, accessible content pages for every public navigation destination. */
(function () {
  'use strict';

  const pages = {
    'manned-guarding': {
      group: 'Services', title: 'Manned Guarding Services', image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1800&auto=format&fit=crop&q=85',
      lead: 'Visible, professional security officers who become a dependable part of your day-to-day operation.',
      intro: 'MAN Commercial Protection provides trained officers for commercial, industrial and public-facing sites across the UK. Each assignment starts with a practical review of the site, its people and its operating hours so the service feels present without getting in the way.',
      side: 'A service built around your site', sideItems: ['Site-specific operating instructions', 'Officer selection and local induction', 'Clear escalation and incident reporting', '24-hour operational support'],
      cards: [['Access control', 'Manage visitors, contractors, deliveries and restricted areas with a calm, consistent front line.'], ['Patrols and deterrence', 'Planned patrols help protect property, equipment and the people who use your site.'], ['Out-of-hours cover', 'Flexible cover for nights, weekends, holidays and short-notice operational changes.']],
      process: [['Understand the site', 'We review your risks, routines and the role security needs to play.'], ['Build the brief', 'A clear service plan defines the people, procedures and reporting required.'], ['Mobilise and review', 'We introduce the team, monitor delivery and refine the service as your needs change.']]
    },
    'cctv-monitoring': {
      group: 'Services', title: 'CCTV Monitoring', image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=1800&auto=format&fit=crop&q=85',
      lead: 'Remote visual protection that helps you see, assess and respond to activity at your premises.',
      intro: 'CCTV monitoring is a flexible way to protect sites when they are most vulnerable. MAN Commercial Protection can support monitored cameras, response procedures and the people who manage incidents, helping clients maintain oversight across single and multi-site estates.',
      side: 'Monitoring priorities', sideItems: ['Clear response instructions', 'Live incident assessment', 'Documented event reporting', 'Integration with on-site security'],
      cards: [['Remote observation', 'A monitoring plan helps ensure important activity is assessed against agreed site rules.'], ['Incident response', 'Escalation procedures set out who is contacted and what happens next.'], ['Better visibility', 'Regular reporting gives managers a useful picture of patterns and recurring issues.']],
      process: [['Review your system', 'We look at coverage, activity patterns and the outcomes you need.'], ['Agree the response', 'Contacts, escalation routes and reporting are set out clearly.'], ['Operate with insight', 'Monitoring and reports support informed operational decisions.']]
    },
    'concierge-security': {
      group: 'Services', title: 'Concierge Security Services', image: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1800&auto=format&fit=crop&q=85',
      lead: 'A welcoming front-of-house experience backed by confident, professional security.',
      intro: 'For offices, residential developments and mixed-use locations, the front desk sets the tone. MAN Commercial Protection combines customer care, visitor management and a security-aware presence so tenants, guests and contractors receive the right welcome every time.',
      side: 'Front-of-house support', sideItems: ['Visitor and contractor management', 'Reception and switchboard support', 'Building checks and reporting', 'Emergency assistance procedures'],
      cards: [['First impressions', 'Professional, personable officers help create an organised and welcoming arrival experience.'], ['Visitor journeys', 'Arrival, registration and access steps can be tailored to your building.'], ['Building reassurance', 'A security-conscious presence supports tenants and facilities teams throughout the day.']],
      process: [['Set the standard', 'We learn your brand, building rules and customer expectations.'], ['Prepare the team', 'Officers receive the information and local training needed to represent you well.'], ['Keep it consistent', 'Regular support and reviews help keep service standards high.']]
    },
    'event-security': {
      group: 'Services', title: 'Event Security', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1800&auto=format&fit=crop&q=85',
      lead: 'Experienced security and crowd-management support for events of every scale.',
      intro: 'From live music and sporting events to corporate gatherings and public occasions, MAN Commercial Protection plans security around the audience, venue and programme. The team works with organisers and venue partners to make safety practical, visible and proportionate.',
      side: 'Event planning essentials', sideItems: ['Pre-event security planning', 'Entry, exit and queue management', 'Crowd observation and welfare', 'Clear event-day command structure'],
      cards: [['Venue readiness', 'Site walks and briefing material help everyone understand routes, zones and responsibilities.'], ['Guest experience', 'Professional teams balance firm access control with a helpful, welcoming approach.'], ['Flexible deployment', 'Staffing can adapt to changing attendance, weather and programme requirements.']],
      process: [['Plan together', 'We meet with organisers to understand the event, audience and site.'], ['Prepare the operation', 'Briefings, posts and communications are confirmed before event day.'], ['Deliver and debrief', 'The operation is managed live, then reviewed for future improvements.']]
    },
    'keyholding-alarm-response': {
      group: 'Services', title: 'Keyholding & Alarm Response', image: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?w=1800&auto=format&fit=crop&q=85',
      lead: 'A dependable response plan that keeps keyholders out of avoidable risk.',
      intro: 'An alarm call in the middle of the night should not mean a member of your team has to attend alone. MAN Commercial Protection can provide keyholding and response arrangements with agreed instructions, controlled key storage and clear reports after every attendance.',
      side: 'A safer response arrangement', sideItems: ['Secure key control process', 'Agreed alarm response procedures', 'Lock and unlock arrangements', 'Attendance and incident reporting'],
      cards: [['Alarm response', 'A trained officer attends according to your agreed instructions and escalation route.'], ['Open and close', 'Scheduled opening and closing support helps keep daily access routines reliable.'], ['Vacant property cover', 'Regular checks and prompt response can support empty or temporarily closed sites.']],
      process: [['Confirm your contacts', 'We document authorised contacts, alarms and escalation instructions.'], ['Secure the keys', 'Keys are recorded and held within an agreed controlled process.'], ['Respond and report', 'Each attendance follows the agreed plan and is reported back clearly.']]
    },
    'systems-solutions': {
      group: 'Services', title: 'Security Systems Solutions', image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=1800&auto=format&fit=crop&q=85',
      lead: 'Practical systems advice to complement people-led security and monitoring.',
      intro: 'Security works best when physical measures, technology and trained people are considered together. MAN Commercial Protection can help clients identify where cameras, access controls, alarms or site processes can strengthen their wider protection plan.',
      side: 'A joined-up approach', sideItems: ['Site and risk review', 'CCTV and access-control planning', 'Response process design', 'Support for multi-site estates'],
      cards: [['Assess the gaps', 'We help identify where a system could improve visibility, control or evidence.'], ['Choose proportionately', 'Recommendations are designed around your environment and operational needs.'], ['Connect the response', 'Technology becomes more useful when people know exactly how to act on it.']],
      process: [['Start with risk', 'A site discussion focuses effort where it can make the greatest difference.'], ['Create the plan', 'The proposed solution is matched to people, process and property.'], ['Review performance', 'As your site changes, the plan can evolve with it.']]
    },
    'corporate-concierge': {
      group: 'Sectors', title: 'Corporate & Concierge Security', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1800&auto=format&fit=crop&q=85',
      lead: 'Security support for offices and developments where service matters as much as protection.',
      intro: 'Corporate environments need a discreet, polished presence that keeps people moving safely. MAN Commercial Protection supports workplaces and developments with officers who understand access, visitor management, facilities routines and the importance of a professional welcome.',
      side: 'Designed for busy buildings', sideItems: ['Reception and concierge coverage', 'Visitor and contractor controls', 'Office and building patrols', 'Facilities-team coordination'],
      cards: [['Workplace access', 'Help manage visitors and contractors through a clear, friendly process.'], ['Tenant reassurance', 'Visible support gives occupiers someone to turn to when they need help.'], ['Facilities partnership', 'Security can work in step with building management and maintenance teams.']],
      process: [['Learn the building', 'We understand occupiers, peak times and the front-of-house experience.'], ['Agree the service', 'Posts, duties and communications are documented for clarity.'], ['Support the estate', 'Reviews keep the arrangement aligned with building activity.']]
    },
    'retail': {
      group: 'Sectors', title: 'Retail Security', image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1800&auto=format&fit=crop&q=85',
      lead: 'A reassuring, customer-aware presence for retail teams, stock and shoppers.',
      intro: 'Retail security has to protect people and property while preserving a positive customer environment. MAN Commercial Protection helps stores, centres and retail parks manage loss prevention, staff reassurance and response procedures with a professional and measured approach.',
      side: 'Retail priorities', sideItems: ['Visible deterrence', 'Customer and colleague reassurance', 'Incident reporting', 'Centre and store coordination'],
      cards: [['Store support', 'Officers can provide a visible presence during busy and vulnerable trading periods.'], ['Loss prevention', 'Clear observation and reporting support a consistent approach to incidents.'], ['Customer welfare', 'A calm, approachable team can help when customers or colleagues need assistance.']],
      process: [['Understand the trading day', 'We look at store layout, peak periods and key concerns.'], ['Set practical routines', 'Roles and reporting are aligned with your retail operation.'], ['Review outcomes', 'Ongoing reporting helps identify recurring issues and opportunities.']]
    },
    'manufacturing': {
      group: 'Sectors', title: 'Manufacturing Security', image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1800&auto=format&fit=crop&q=85',
      lead: 'Robust security support for complex, safety-conscious industrial environments.',
      intro: 'Manufacturing sites often operate around the clock with a steady flow of employees, contractors, materials and vehicles. MAN Commercial Protection provides a structured security presence that supports gatehouse routines, site rules and the wider safety culture.',
      side: 'Industrial site support', sideItems: ['Gatehouse and vehicle control', 'Contractor sign-in processes', 'Perimeter checks and patrols', 'Out-of-hours site cover'],
      cards: [['Controlled entry', 'Consistent access routines help keep the right people and vehicles in the right places.'], ['Operational awareness', 'Officers work to your site rules and safety expectations.'], ['Asset protection', 'Planned checks help protect equipment, materials and restricted areas.']],
      process: [['Review the operation', 'We assess access routes, shifts and site-specific rules.'], ['Build local procedures', 'Instructions are tailored to the way your facility operates.'], ['Maintain standards', 'Management support and reporting help keep delivery consistent.']]
    },
    'public-sector': {
      group: 'Sectors', title: 'Public Sector Security', image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1800&auto=format&fit=crop&q=85',
      lead: 'Professional security that supports public-facing services with care and consistency.',
      intro: 'Public-sector and community settings bring together diverse visitors, staff and services. MAN Commercial Protection helps organisations create a calm, secure environment through clear access arrangements, visible support and well-defined incident procedures.',
      side: 'Public-facing environments', sideItems: ['Visitor management', 'Professional, approachable officers', 'Incident response procedures', 'Support for facilities teams'],
      cards: [['People first', 'The approach is respectful, proportionate and mindful of public service environments.'], ['Clear routines', 'Access and incident processes are designed to be easy for teams to follow.'], ['Responsive support', 'A visible security presence can help staff respond confidently to concerns.']],
      process: [['Listen and assess', 'We learn how your service operates and the people it supports.'], ['Create a proportionate plan', 'The service is built around practical risks and daily routines.'], ['Work in partnership', 'Regular communication helps maintain confidence and consistency.']]
    },
    'logistics-distribution': {
      group: 'Sectors', title: 'Logistics & Distribution Security', image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1800&auto=format&fit=crop&q=85',
      lead: 'Security that keeps high-activity yards, warehouses and gatehouses moving safely.',
      intro: 'Distribution sites need a clear, responsive security presence at every hour of the day. MAN Commercial Protection supports gatehouses, vehicle movements, visitor processes and site patrols with procedures that work around the pace of your operation.',
      side: 'Keeping operations moving', sideItems: ['Gatehouse and driver processes', 'Vehicle and visitor checks', 'Yard and perimeter patrols', 'Shift-handover reporting'],
      cards: [['Gatehouse control', 'Structured arrival and departure routines support site access and traffic flow.'], ['Yard visibility', 'Planned patrols and communication help maintain awareness across large sites.'], ['Business continuity', 'Flexible cover supports peak seasons, shift changes and operational variation.']],
      process: [['Map the movement', 'We review vehicles, people, access points and shift patterns.'], ['Define the routine', 'Site instructions make responsibilities clear for every shift.'], ['Keep improving', 'Reports and reviews support ongoing refinement.']]
    },
    'ceo-message': {
      group: 'About MAN', title: 'Welcome from Our Chief Executive Officer', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=1800&auto=format&fit=crop&q=85',
      lead: 'A people-focused company approach to dependable security across the UK.',
      intro: 'MAN Commercial Protection has grown by putting customers and colleagues at the centre of its work. Our aim is simple: provide a professional, responsive service that clients can rely on, while giving our teams the training, support and respect they deserve.',
      side: 'What guides our work', sideItems: ['Long-term client relationships', 'Respect for every colleague', 'Professional operational standards', 'Continuous learning and improvement'],
      cards: [['Our people', 'The quality of a security service is defined by the people who deliver it every day.'], ['Our clients', 'We listen carefully and build a service around the way each client operates.'], ['Our responsibility', 'Honest communication and consistent delivery are central to how we work.']],
      process: [['Listen', 'We begin with an open conversation about what matters to you.'], ['Deliver', 'A committed operational team turns that understanding into day-to-day service.'], ['Grow together', 'Regular reviews strengthen relationships over time.']]
    },
    'history': {
      group: 'About MAN', title: 'Our History', image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1800&auto=format&fit=crop&q=85',
      lead: 'Over three decades of experience in security, built around people and service.',
      intro: 'Founded in 1993, MAN Commercial Protection began with a commitment to deliver a more personal, customer-focused security service. Today, the company supports clients across the UK with a broad range of security, monitoring, concierge and event services.',
      side: 'Our story in brief', sideItems: ['Established in 1993', 'UK-wide service delivery', 'Family-run leadership', 'A growing range of security expertise'],
      cards: [['1993: The beginning', 'MAN Commercial Protection was founded around the belief that great service creates lasting relationships.'], ['Growing capability', 'The company expanded its service offering to meet the changing needs of UK clients.'], ['Today and beyond', 'Investment in people, training and operations supports the next chapter of growth.']],
      process: [['Start with trust', 'From the beginning, the focus has been on being a dependable partner.'], ['Learn and adapt', 'The service evolves alongside client needs and the security environment.'], ['Invest in people', 'Training and support remain central to consistent delivery.']]
    },
    'accreditations': {
      group: 'About MAN', title: 'Accreditations & Certifications', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1800&auto=format&fit=crop&q=85',
      lead: 'Independent standards and professional memberships that support quality service delivery.',
      intro: 'MAN Commercial Protection works to recognised industry standards and maintains professional memberships that help underpin its approach to quality, training and operational practice. Certifications are reviewed as part of the company’s ongoing commitment to high standards.',
      side: 'Quality assurance', sideItems: ['SIA Approved Contractor Scheme status', 'BSIA membership', 'Quality-management certification', 'Regular operational review'],
      cards: [['Independent assessment', 'External standards provide useful structure for reviewing processes and performance.'], ['Professional practice', 'Memberships and industry engagement help keep the team connected to best practice.'], ['Client confidence', 'Documented processes and reviews support reliable, transparent service.']],
      process: [['Set the standard', 'Policies and procedures define how quality is managed.'], ['Check performance', 'Internal and external reviews help identify improvements.'], ['Act on learning', 'Findings are used to strengthen systems and service delivery.']]
    },
    'policies': {
      group: 'About MAN', title: 'Policies & Company Standards', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1800&auto=format&fit=crop&q=85',
      lead: 'Clear principles and procedures that shape how MAN Commercial Protection works.',
      intro: 'Policies provide a practical framework for quality, safety, equality, environmental responsibility and the handling of information. They help our people understand the standards expected of them and give clients a clear view of the way services are managed.',
      side: 'Policy areas', sideItems: ['Quality and service management', 'Health, safety and wellbeing', 'Equality, diversity and inclusion', 'Environmental responsibility'],
      cards: [['Clear expectations', 'Accessible policies help colleagues make sound decisions in daily work.'], ['Consistent practice', 'Shared procedures support the same standard across every assignment.'], ['Regular review', 'Documents are reviewed and updated as operations and requirements evolve.']],
      process: [['Document the standard', 'Policies set out the principles that guide the business.'], ['Put them into practice', 'Training and local instructions translate policy into action.'], ['Review and improve', 'Feedback and review help keep the framework relevant.']]
    },
    'ethics-values': {
      group: 'About MAN', title: 'Ethics & Values', image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1800&auto=format&fit=crop&q=85',
      lead: 'Security with integrity: respectful people, honest communication and responsible decisions.',
      intro: 'Our values influence how we treat colleagues, clients, visitors and the communities in which we work. We believe a trusted security partner should act fairly, communicate openly and remain accountable for the service it provides.',
      side: 'Our values in action', sideItems: ['Integrity and professionalism', 'Respect for people', 'Accountability', 'Partnership and service'],
      cards: [['Do the right thing', 'We expect colleagues to make responsible choices and raise concerns when something is not right.'], ['Treat people well', 'Respect, inclusion and dignity are essential to a positive working environment.'], ['Own the outcome', 'We communicate clearly and take responsibility for the service we deliver.']],
      process: [['Lead by example', 'Values start with leadership and are reinforced across the company.'], ['Make them practical', 'Training and management support embed values in everyday actions.'], ['Keep listening', 'Feedback and discussion help ensure values remain lived, not just written.']]
    },
    'esg': {
      group: 'About MAN', title: 'Environmental, Social & Governance', image: 'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?w=1800&auto=format&fit=crop&q=85',
      lead: 'Responsible security services that consider people, communities and our environmental impact.',
      intro: 'MAN Commercial Protection recognises that responsible business practice matters. Our ESG approach focuses on supporting colleagues, making thoughtful operational choices, maintaining strong governance and contributing positively to the communities connected to our work.',
      side: 'ESG focus areas', sideItems: ['Colleague wellbeing and development', 'Community participation', 'Resource-conscious operations', 'Transparent governance'],
      cards: [['Environmental', 'We look for practical ways to reduce waste and make better operational choices.'], ['Social', 'People, training and community relationships are central to the company’s purpose.'], ['Governance', 'Clear oversight and accountable decision-making support sustainable growth.']],
      process: [['Identify priorities', 'We focus on the areas where the business can have a meaningful impact.'], ['Take practical action', 'Plans are translated into improvements in day-to-day operations.'], ['Measure and learn', 'Review and feedback help shape what comes next.']]
    },
    'client-testimonials': {
      group: 'Clients', title: 'Client Testimonials', image: 'https://images.unsplash.com/photo-1556761175-5973dcf?auto=format&fit=crop&w=1800&q=85',
      lead: 'Long-term partnerships built on responsive support and consistent service delivery.',
      intro: 'Clients choose MAN Commercial Protection for a service that is designed around their sites, people and objectives. We value straightforward communication, active management and a willingness to adapt when an operation changes.',
      side: 'What clients value', sideItems: ['Responsive communication', 'Professional site teams', 'Flexible operational support', 'A partnership approach'],
      cards: [['Designed around the brief', 'We take time to understand what success looks like for each client.'], ['Managed closely', 'Operational oversight and regular communication keep the service connected.'], ['Built to last', 'Long-term relationships grow from reliable people and honest conversations.']],
      process: [['Understand your needs', 'We start with your site, stakeholders and priorities.'], ['Mobilise carefully', 'The plan and team are introduced with clear ownership.'], ['Review together', 'Regular conversations keep the service relevant and effective.']]
    },
    'client-partnerships': {
      group: 'Clients', title: 'Client Partnerships', image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1800&auto=format&fit=crop&q=85',
      lead: 'Collaborative security relationships that evolve with your organisation.',
      intro: 'Security is most effective when it is a partnership. MAN Commercial Protection works alongside client teams, venue operators and facilities managers to create practical plans, respond to change and keep service delivery aligned with real operational needs.',
      side: 'How partnership works', sideItems: ['Shared planning and communication', 'Regular operational reviews', 'Flexible service development', 'Clear points of accountability'],
      cards: [['A shared brief', 'Everyone understands the purpose of the service and the outcomes it should support.'], ['Useful reporting', 'Information is presented clearly so it can support decisions, not just compliance.'], ['Adaptable support', 'The service can change as your sites, teams or risk profile evolve.']],
      process: [['Bring teams together', 'We establish the right working relationships from the start.'], ['Maintain visibility', 'Open communication keeps priorities visible to everyone involved.'], ['Plan ahead', 'Review meetings identify opportunities before they become pressures.']]
    },
    'training-courses': {
      group: 'Training', title: 'Training Courses', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1800&auto=format&fit=crop&q=85',
      lead: 'Practical learning designed to build confidence, capability and professional standards.',
      intro: 'The MAN Training Academy provides security and workplace-safety learning in a supportive, professional environment. Courses are structured around practical knowledge, clear guidance and the requirements people need for their chosen role or workplace responsibility.',
      side: 'Training support', sideItems: ['Security-industry learning', 'First aid and safety training', 'Experienced trainers', 'Support before and after the course'],
      cards: [['Security courses', 'Training supports people preparing for or developing their security careers.'], ['First aid', 'Practical first-aid learning helps organisations prepare colleagues to respond.'], ['Workplace skills', 'Additional learning supports safer, more confident day-to-day operations.']],
      process: [['Choose the right course', 'Talk to the training team about the experience or outcome you need.'], ['Learn with confidence', 'Courses are delivered in a clear, practical and supportive way.'], ['Use your learning', 'Participants leave with knowledge they can apply in the workplace.']]
    },
    'security-insights': {
      group: 'News & Insights', title: 'Security Insights', image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1800&auto=format&fit=crop&q=85',
      lead: 'Updates, practical perspectives and stories from across MAN Commercial Protection.',
      intro: 'The security environment changes quickly. Our news and insights bring together company updates, event stories and useful perspectives on the work our teams do throughout the UK.',
      side: 'Follow our updates', sideItems: ['Company news', 'Industry and event stories', 'Training updates', 'Community activity'],
      cards: [['Company news', 'See recent developments, recognition and stories from the wider MAN team.'], ['Practical perspectives', 'Explore topics that matter to clients, colleagues and the security profession.'], ['In the community', 'Read about the people, events and partnerships connected to our work.']],
      process: [['Stay connected', 'Follow the latest company stories and updates.'], ['Learn from practice', 'Insights draw on everyday operational experience.'], ['Start a conversation', 'Talk to the team if an article raises a question about your own site.']]
    },
    'latest-news': {
      group: 'News & Insights', title: 'Latest News', image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1800&auto=format&fit=crop&q=85',
      lead: 'News, team stories and milestones from MAN Commercial Protection.',
      intro: 'Our news area shares what is happening across the business, from operational milestones and community activity to recognition for colleagues and event teams. It is a useful window into the people behind the service.',
      side: 'From our newsroom', sideItems: ['Company announcements', 'Awards and recognition', 'Team and community stories', 'Event and operations updates'],
      cards: [['Company updates', 'Follow news about MAN Commercial Protection and the work our teams are doing.'], ['People stories', 'Read about colleagues whose professionalism and effort make a difference every day.'], ['In the community', 'See the partnerships and activities that connect the business to local communities.']],
      process: [['Read the latest', 'Browse recent stories and company announcements.'], ['Follow the journey', 'Keep up with the people and projects behind the headlines.'], ['Get in touch', 'Contact the team if you would like to know more.']]
    },
    'why-training': {
      group: 'Training', title: 'Why Choose MAN Training Academy?', image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1800&auto=format&fit=crop&q=85',
      lead: 'A supportive learning environment with practical training at its heart.',
      intro: 'The MAN Training Academy is designed to make professional learning clear, welcoming and relevant. Whether you are starting in security, developing a workplace skill or refreshing your knowledge, the emphasis is on practical confidence and useful support.',
      side: 'The learning experience', sideItems: ['Practical, relevant delivery', 'Experienced trainer support', 'Clear course guidance', 'A professional learning environment'],
      cards: [['Learn by doing', 'Training connects course content to real situations and practical decision-making.'], ['Ask questions', 'A supportive classroom helps every learner get the clarity they need.'], ['Leave prepared', 'The aim is knowledge and confidence that participants can use straight away.']],
      process: [['Talk through your goals', 'The team can help you identify the course that best suits your next step.'], ['Attend with confidence', 'You receive clear information about what to expect before the day.'], ['Apply your learning', 'Take the knowledge back into your role, workplace or career journey.']]
    },
    'training-reviews': {
      group: 'Training', title: 'Training Reviews', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1800&auto=format&fit=crop&q=85',
      lead: 'Learner feedback helps us keep every course practical, welcoming and worthwhile.',
      intro: 'Feedback is a valuable part of the learning process. The MAN Training Academy uses learner input to understand what is working well and where the training experience can be made even clearer, more useful and more supportive.',
      side: 'Our review approach', sideItems: ['Clear joining information', 'Supportive teaching style', 'Practical learning focus', 'Continuous course improvement'],
      cards: [['Before the course', 'We aim to make booking and joining information straightforward and helpful.'], ['During the course', 'Trainers create space for questions, practice and constructive discussion.'], ['After the course', 'Feedback helps shape future course delivery and learner support.']],
      process: [['Share your experience', 'Learners are invited to reflect on the course experience.'], ['Review feedback', 'The training team considers what can be strengthened.'], ['Improve delivery', 'Useful feedback is turned into practical improvements.']]
    },
    'company-awards': {
      group: 'About MAN', title: 'Outstanding Act Awards', image: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=1800&auto=format&fit=crop&q=85',
      lead: 'Recognising colleagues who go above and beyond for clients, communities and each other.',
      intro: 'The Outstanding Act Awards celebrate the everyday professionalism, care and initiative shown by people across MAN Commercial Protection. Recognition is an important way to share great work and thank colleagues whose actions make a meaningful difference.',
      side: 'What we celebrate', sideItems: ['Exceptional customer service', 'Teamwork and leadership', 'Community contribution', 'Positive everyday actions'],
      cards: [['See great work', 'Awards help bring exceptional actions into view across the company.'], ['Share positive examples', 'Stories of great service encourage colleagues and build pride.'], ['Say thank you', 'Recognition matters when people have made an extra effort.']],
      process: [['Notice the difference', 'Great work often starts with a colleague noticing what matters.'], ['Share the story', 'Nominations make meaningful contributions visible.'], ['Celebrate together', 'Recognition gives the wider team a reason to be proud.']]
    },
    'employee-stories': {
      group: 'About MAN', title: 'Employee Stories', image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1800&auto=format&fit=crop&q=85',
      lead: 'Meet the people who bring professional security services to life every day.',
      intro: 'MAN Commercial Protection is powered by people with different skills, backgrounds and career paths. Employee stories highlight the commitment, learning and teamwork behind the service clients experience at their sites and events.',
      side: 'Our people focus', sideItems: ['Training and development', 'Clear operational support', 'Respect and inclusion', 'Pride in professional service'],
      cards: [['Career journeys', 'People can build skills and confidence through varied roles and experiences.'], ['Team connections', 'Strong site teams are supported by operations, training and head-office colleagues.'], ['Professional pride', 'Good work deserves to be seen and shared across the organisation.']],
      process: [['Join the conversation', 'Find out what working in security can look like at MAN Commercial Protection.'], ['Build experience', 'Training and support help people grow in their role.'], ['Make a difference', 'Every colleague contributes to a safer, better-managed environment.']]
    }
  };

  const requested = new URLSearchParams(window.location.search).get('page');
  const page = pages[requested] || pages['manned-guarding'];
  const title = `${page.title} | MAN Commercial Protection`;
  document.title = title;

  const serviceLinks = [
    ['manned-guarding', 'Manned Guarding'], ['cctv-monitoring', 'CCTV Monitoring'], ['concierge-security', 'Concierge'], ['event-security', 'Event Security'], ['keyholding-alarm-response', 'Keyholding']
  ];
  const sectorLinks = [
    ['corporate-concierge', 'Corporate'], ['retail', 'Retail'], ['manufacturing', 'Manufacturing'], ['public-sector', 'Public Sector'], ['logistics-distribution', 'Logistics']
  ];
  const detailLink = (id, label) => `<a href="details.html?page=${id}">${label}</a>`;
  const navList = serviceLinks.map(([id, label]) => detailLink(id, label)).join('');
  const footerServices = serviceLinks.map(([id, label]) => detailLink(id, label)).join('');
  const footerSectors = sectorLinks.map(([id, label]) => detailLink(id, label)).join('');
  const related = Object.entries(pages).filter(([id, item]) => id !== requested && item.group === page.group).slice(0, 3);

  const appEl = document.getElementById('detail-app');
  if (appEl) {
    appEl.innerHTML = `
      <section class="detail-hero" style="--detail-image:url('${page.image}')">
        <div class="container detail-hero__content">
          <div class="detail-eyebrow">${page.group}</div>
          <h1>${page.title}</h1>
          <p>${page.lead}</p>
          <div class="detail-breadcrumb">
            <a href="index.html">Home</a> &nbsp;/&nbsp; 
            <a href="${page.group === 'Services' ? 'services.html' : page.group === 'Sectors' ? 'sectors.html' : page.group === 'Training' ? 'training.html' : page.group === 'Clients' ? 'clients.html' : page.group === 'About MAN' ? 'about.html' : 'news.html'}">${page.group}</a> &nbsp;/&nbsp; ${page.title}
          </div>
        </div>
      </section>
      <main>
        <section class="detail-content">
          <div class="container detail-intro">
            <div>
              <div class="detail-eyebrow">Professional. Responsive. Trusted.</div>
              <h2>Security support that fits the way you work.</h2>
              <p>${page.intro}</p>
              <p>Our team will work with you to understand the detail, build a clear plan and provide dependable support as your requirements develop.</p>
            </div>
            <aside class="detail-panel">
              <h3>${page.side}</h3>
              <ul>${page.sideItems.map(item => `<li><i class="fas fa-check"></i>${item}</li>`).join('')}</ul>
            </aside>
          </div>
        </section>
        <section class="detail-grid-section">
          <div class="container">
            <div class="detail-section-heading">
              <div class="detail-eyebrow">Our approach</div>
              <h2>Practical support, delivered with care.</h2>
            </div>
            <div class="detail-cards">${page.cards.map((card, i) => `<article class="detail-card"><div class="detail-card__number">0${i + 1}</div><h3>${card[0]}</h3><p>${card[1]}</p></article>`).join('')}</div>
          </div>
        </section>
        <section class="detail-process">
          <div class="container">
            <div class="detail-section-heading">
              <div class="detail-eyebrow">Getting started</div>
              <h2>A clear route from conversation to confidence.</h2>
            </div>
            <ol class="detail-process__list">${page.process.map(step => `<li><strong>${step[0]}</strong>${step[1]}</li>`).join('')}</ol>
          </div>
        </section>
        ${related.length ? `<section class="detail-grid-section"><div class="container"><div class="detail-section-heading"><div class="detail-eyebrow">Explore more</div><h2>Related ${page.group.toLowerCase()} pages.</h2></div><div class="detail-cards">${related.map(([id, item], i) => `<a class="detail-card" href="details.html?page=${id}"><div class="detail-card__number">0${i + 1}</div><h3>${item.title}</h3><p>${item.lead}</p></a>`).join('')}</div></div></section>` : ''}
        <section class="detail-cta">
          <div class="container">
            <h2>Talk to our team about ${page.title.toLowerCase()}.</h2>
            <p>Tell us about your site or requirements and we’ll help you identify the right next step.</p>
            <a class="detail-button" href="contact.html"><i class="fas fa-file-signature"></i> Request a quote</a>
          </div>
        </section>
      </main>`;
  }

  // Highlight active link in the navigation
  const navGroupMap = {
    'About MAN': 'about.html',
    'Services': 'services.html',
    'Sectors': 'sectors.html',
    'Clients': 'clients.html',
    'Training': 'training.html',
    'News & Insights': 'news.html'
  };
  const targetHref = navGroupMap[page.group];
  if (targetHref) {
    document.querySelectorAll('.nav__link').forEach(link => {
      if (link.getAttribute('href') === targetHref) {
        link.classList.add('nav__link--active');
      } else {
        link.classList.remove('nav__link--active');
      }
    });
  }
})();
