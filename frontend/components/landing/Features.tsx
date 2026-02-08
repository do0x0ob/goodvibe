import React from 'react';
import { Container } from '../layout/Container';

export const Features: React.FC = () => {
  const features = [
    {
      title: 'Flexible Yield Allocation',
      description: 'Deposit USDC and customize how much of your yield (0-100%) goes to projects you care about. Your principal stays safe while your earnings make an impact.',
      icon: (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'Verified Project Management',
      description: 'Project creators hold secure capability objects that allow them to withdraw accumulated donations and post regular updates on their progress.',
      icon: (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      title: 'Diverse Project Categories',
      description: 'Support causes across multiple categories: Wildlife Conservation, Education, Technology, Healthcare, Environment, and more. Filter and discover projects that align with your values.',
      icon: (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    }
  ];

  return (
    <div className="pt-12 pb-24 bg-canvas-default">
      <Container>
        <div className="bg-canvas-sage rounded-3xl p-8 md:p-12">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="text-ink-900 mb-4 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-serif text-ink-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-ink-700 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
};
