import React, { useState } from 'react';
import './form.css'

const Form = ({ onAnswersChange }) => {
  // set this from API call
  const questions = [
    {
      question: 'What is their perceived race?',
      options: ['White', 'Black or African American', 'American Indian or Alaska Native', 'Asian', 'Native Hawaiian or Other Pacific Islander']
    },
    {
      question: 'What is their perceived age?',
      options: ['<18', '18-30', '30-45', '45-65', '65+']
    },
    {
      question: 'What is the perceived socio-economic status as evidenced by their car make/model/condition?',
      options: ['Poor', 'Working Class', 'Middle Class', 'Wealthy']
    }
  ];
  const [answers, setAnswers] = useState({});

  // maintaining the answers along with the question in particular tab
  const handleChange = event => {
    const { name, value } = event.target;
    setAnswers(answers => {
      const newAnswers = { ...answers, [name]: value };
      onAnswersChange(newAnswers);
      return newAnswers;
    });
  };

  return (
    <form>
      {questions.map((question, index) => (
        <fieldset key={index}>
          <legend>{question.question}</legend>
          {question.options.map((option, index) => (
            <div key={index}>
              <input type="radio" id={`${question.question}-${index}`} name={question.question} value={option} onChange={handleChange} />
              <label htmlFor={`${question.question}-${index}`}>{option}</label>
            </div>
          ))}
        </fieldset>
      ))}
    </form>
  );
}

export default Form;