import React, { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  InputLabel,
  Paper,
  Container,
  Grid,
  Collapse,
  Divider,
} from '@mui/material';

function App() {
  const [file, setFile] = useState(null);
  const [action, setAction] = useState('summarize');
  const [result, setResult] = useState('');
  const [quiz, setQuiz] = useState([]);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [feedback, setFeedback] = useState([]);

  const handleSubmit = async () => {
    if (!file) return alert('Please upload a PDF.');

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('action', action);

    try {
      const res = await axios.post('http://localhost:5000/process_pdf', formData);
      if (action === 'summarize') {
        setResult(res.data.summary);
        setQuiz([]);
        setScore(null);
      } else {
        setQuiz(res.data.questions);
        setResult('');
        setScore(null);
        setFeedback([]);
      }
    } catch (error) {
      console.error('Error while processing PDF:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleAnswerChange = (id, value) => {
    setAnswers({ ...answers, [id]: value });
  };

  const handleScore = async () => {
    const formattedAnswers = quiz.map((q) => ({
      id: q.id,
      answer: answers[q.id] || '',
      correct_answer: q.answer,
    }));

    try {
      const res = await axios.post('http://localhost:5000/submit-answers', {
        answers: formattedAnswers,
      });
      setScore(res.data.score);
      setFeedback(res.data.details);
    } catch (error) {
      console.error('Error submitting answers:', error);
      alert('An error occurred while submitting answers.');
    }
  };

  return (
    <Box sx={{ background: 'linear-gradient(to right, #e0c3fc, #8ec5fc)', minHeight: '100vh', py: 5 }}>
      <Container maxWidth="md">
        <Paper elevation={6} sx={{ p: 4, borderRadius: 4 }}>
          <Typography variant="h4" align="center" gutterBottom color="primary">
            📚 Smart PDF Summarizer & Quiz Generator
          </Typography>

          <Box sx={{ my: 2 }}>
            <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0])} />
          </Box>

          <FormControl sx={{ my: 2 }}>
            <RadioGroup row value={action} onChange={(e) => setAction(e.target.value)}>
              <FormControlLabel value="summarize" control={<Radio />} label="Summarize" />
              <FormControlLabel value="quiz" control={<Radio />} label="Generate Quiz" />
            </RadioGroup>
          </FormControl>

          <Button variant="contained" onClick={handleSubmit} fullWidth>
            🚀 Submit
          </Button>

          {result && (
            <Card sx={{ my: 4, backgroundColor: '#f3e5f5' }}>
              <CardContent>
                <Typography variant="h5" color="secondary" gutterBottom>
                  📄 Summary:
                </Typography>
                <Typography>{result}</Typography>
              </CardContent>
            </Card>
          )}

          {quiz.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" color="secondary" gutterBottom>
                ❓ Quiz Questions
              </Typography>
              {quiz.map((q) => (
                <Card key={q.id} sx={{ my: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1">{q.question}</Typography>
                    <RadioGroup
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    >
                      {q.options.map((opt, idx) => (
                        <FormControlLabel key={idx} value={opt} control={<Radio />} label={opt} />
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
              ))}
              <Button variant="contained" color="success" onClick={handleScore}>
                📝 Submit Answers
              </Button>
            </Box>
          )}

          {score !== null && (
            <Card sx={{ my: 4, backgroundColor: '#e8f5e9' }}>
              <CardContent>
                <Typography variant="h5" color="green" gutterBottom>
                  ✅ Your Score: {score} / {feedback.length}
                </Typography>

                <Divider sx={{ my: 2 }} />

                {feedback.map((item) => (
                  <Box key={item.id} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">
                      Q{item.id}: {item.is_correct ? '✅ Correct' : '❌ Incorrect'}
                    </Typography>
                    {!item.is_correct && (
                      <Collapse in>
                        <Typography>❌ Your Answer: {item.your_answer}</Typography>
                        <Typography>✅ Correct Answer: {item.correct}</Typography>
                        <Typography>📝 Explanation: {item.explanation}</Typography>
                      </Collapse>
                    )}
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}
        </Paper>
      </Container>
    </Box>
  );
}

export default App;
