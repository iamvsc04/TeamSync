import React, { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import { useTheme } from '@mui/material';

const OnboardingTour = () => {
  const muiTheme = useTheme();
  const [run, setRun] = useState(false);

  useEffect(() => {
    const tourCompleted = localStorage.getItem('teamSync_tourCompleted');
    if (!tourCompleted) {
      const timer = setTimeout(() => {
        setRun(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const steps = [
    {
      target: '.sidebar-toggle',
      content: 'You can collapse the sidebar anytime to get more space for your work.',
      placement: 'right',
    },
    {
      target: '.sidebar-dashboard',
      content: 'Welcome to TeamSync! This is your central hub for all project activities.',
      placement: 'right',
    },
    {
      target: '.sidebar-projects',
      content: 'Manage and track all your ongoing projects here.',
      placement: 'right',
    },
    {
      target: '.dashboard-stats',
      content: 'Quickly glance at your active projects and success metrics.',
      placement: 'bottom',
    },
    {
      target: '.dashboard-performance',
      content: 'Monitor your team performance with real-time data visualizations.',
      placement: 'top',
    },
    {
      target: '.sidebar-settings',
      content: 'Customize your profile, notifications, and security settings here.',
      placement: 'right',
    },
  ];

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      localStorage.setItem('teamSync_tourCompleted', 'true');
      setRun(false);
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        options: {
          primaryColor: muiTheme.palette.primary.main,
          zIndex: 10000,
          backgroundColor: muiTheme.palette.background.paper,
          textColor: muiTheme.palette.text.primary,
        },
        tooltipContainer: {
          textAlign: 'left',
          borderRadius: '16px',
          padding: '10px',
        },
        buttonNext: {
          borderRadius: '8px',
          fontWeight: 700,
        },
        buttonBack: {
          fontWeight: 700,
          marginRight: 10,
        },
        buttonSkip: {
          color: muiTheme.palette.text.secondary,
        }
      }}
    />
  );
};

export default OnboardingTour;
