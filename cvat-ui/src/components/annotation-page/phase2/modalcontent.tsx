import React, { useState } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import './modalcontent.css'
import Form from './form';

const ModalContent = (props) => {
    const [tabIndex, setTabIndex] = useState(0);
    const {currTime} = props;

    // set this from API call
    var tagData = [['Citizen1',3.1], ['Citizen2',2], ['Police1',1], ['Police2',8]]
    // Finding the tags which have appeared till now
    tagData = tagData.filter(elt => elt[1] <= currTime).map(elt => elt[0]);

    // tabAnswers has the annotations for each tab
    const [tabAnswers, setTabAnswers] = useState({});

    const handleTabChange = (event, newTabIndex) => {
      setTabIndex(newTabIndex);
    };

    // Maintaining question-answers along with the tag
    const handleAnswersChange = (name, answers) => {
      setTabAnswers(tabAnswers => ({ ...tabAnswers, [name]: answers }));
    };

    // Modal with tag tabs
    return (
      <Box className='phase2-modal-box'>
        <Tabs className='phase2-modal-tabs' value={tabIndex} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
        {tagData.map((name, index) => (
            <Tab key={index} label={name} />
          ))}
        </Tabs>
        {tagData.map((name, index) => (
          <div key={index} hidden={index !== tabIndex}>
            <Form onAnswersChange={answers => handleAnswersChange(name, answers)}/>
          </div>
        ))}
      </Box>
    );
  };

  export default ModalContent;