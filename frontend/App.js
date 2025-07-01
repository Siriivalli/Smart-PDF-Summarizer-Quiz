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
  Paper,
  Container,
  Divider,
  Collapse,
  CircularProgress
} from '@mui/material';

function App() {
  const [file, setFile] = useState(null);
  const [action, setAction] = useState('summarize');
  const [summaryLevel, setSummaryLevel] = useState('summary');
  const [numQuestions, setNumQuestions] = useState(5);
  const [result, setResult] = useState('');
  const [quiz, setQuiz] = useState([]);
  const [qna, setQna] = useState([]);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!file) return alert('Please upload a PDF first!');

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('action', action);
    formData.append('summary_level', summaryLevel);
    formData.append('num_questions', numQuestions);

    setLoading(true);
    setResult('');
    setQuiz([]);
    setQna([]);
    setScore(null);
    setFeedback([]);
    setSubmitted(false);

    try {
      const res = await axios.post('http://localhost:5000/process_pdf', formData);

      if (action === 'summarize') {
        setResult(res.data.summary);
      } else if (action === 'quiz') {
        setQuiz(res.data.questions);
      } else if (action === 'qna') {
        setQna(res.data.qna);
      }
    } catch (error) {
      console.error('Error while processing PDF:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (id, value) => {
    setAnswers({ ...answers, [id]: value });
  };

  const handleScore = async () => {
    const formattedAnswers = quiz.map((q, index) => ({
      id: index + 1,
      answer: answers[index + 1] || '',
      correct_answer: q.options[q.correct_answer],
      explanation: q.explanation,
    }));

    try {
      const res = await axios.post('http://localhost:5000/submit-answers', {
        answers: formattedAnswers,
      });
      setScore(res.data.score);
      setFeedback(res.data.details);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting answers:', error);
      alert('An error occurred while submitting answers.');
    }
  };

  return (
    <Box
      sx={{
        backgroundImage: `url('https://images.unsplash.com/photo-1526318472351-bc6e3e7fb8a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80')`,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        py: 5
      }}
    >
      <Container maxWidth="md">
        <Paper elevation={12} sx={{ p: 4, borderRadius: 6, backdropFilter: 'blur(10px)', backgroundColor: 'rgba(255,255,255,0.85)' }}>
          <Typography variant="h4" align="center" gutterBottom color="primary">
            Smart PDF Summarizer, Quiz & Q&A
          </Typography>

          {/* Upload */}
          <Box
            sx={{
              border: '2px dashed #aaa',
              borderRadius: 4,
              p: 2,
              textAlign: 'center',
              backgroundColor: '#fafafa',
              my: 3
            }}
          >
            <Typography variant="body1" gutterBottom>Drop your PDF here or</Typography>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files[0])}
              style={{ marginBottom: '10px' }}
            />
          </Box>

          {/* Action Selector */}
          <FormControl sx={{ my: 2 }}>
            <RadioGroup
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                if (e.target.value !== "summarize") setSummaryLevel("summary");
                if (e.target.value !== "quiz") setNumQuestions(5);
              }}
            >
              <FormControlLabel value="summarize" control={<Radio />} label="Summarize" />
              <FormControlLabel value="quiz" control={<Radio />} label="Generate Quiz" />
              <FormControlLabel value="qna" control={<Radio />} label="Generate Q&A" />
            </RadioGroup>
          </FormControl>

          {/* Summary Level */}
          {action === "summarize" && (
            <Box sx={{ my: 2 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Select Summary Length:
              </Typography>
              <FormControl component="fieldset">
                <RadioGroup
                  value={summaryLevel}
                  onChange={(e) => setSummaryLevel(e.target.value)}
                >
                  <FormControlLabel value="abstract" control={<Radio />} label="Abstract" />
                  <FormControlLabel value="summary" control={<Radio />} label="Summary" />
                </RadioGroup>
              </FormControl>
            </Box>
          )}

          {/* Num Questions */}
          {action === "quiz" && (
            <Box sx={{ my: 2 }}>
              <Typography variant="body1">Number of Questions (1–20):</Typography>
              <input
                type="number"
                min="1"
                max="20"
                value={numQuestions}
                onChange={(e) =>
                  setNumQuestions(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  fontSize: "1rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px"
                }}
              />
            </Box>
          )}

          {/* Action Button */}
          <Button
            variant="contained"
            onClick={handleSubmit}
            fullWidth
            sx={{ py: 1.5, fontWeight: 'bold', fontSize: '1rem', backgroundColor: '#6200ea' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1, color: '#fff' }} />
                Processing...
              </>
            ) : (
              <>
                {action === 'summarize'
                  ? 'Summarize PDF'
                  : action === 'quiz'
                  ? 'Generate Quiz'
                  : 'Generate Q&A'}
              </>
            )}
          </Button>

          {/* Summary */}
          {result && (
            <Card sx={{ my: 4, backgroundColor: '#ede7f6' }}>
              <CardContent>
                <Typography variant="h5" color="secondary" gutterBottom>
                  {summaryLevel.charAt(0).toUpperCase() + summaryLevel.slice(1)}
                </Typography>
                <Typography>{result}</Typography>
              </CardContent>
            </Card>
          )}

          {/* Quiz */}
          {quiz && quiz.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" color="secondary" gutterBottom>
                Quiz Questions
              </Typography>
              {quiz.map((q, index) => (
                <Card key={index} sx={{ my: 2, p: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {index + 1}. {q.question}
                    </Typography>
                    <RadioGroup
                      value={answers[index + 1] || ''}
                      onChange={(e) => handleAnswerChange(index + 1, e.target.value)}
                    >
                      {Object.entries(q.options).map(([key, value]) => (
                        <FormControlLabel
                          key={key}
                          value={value}
                          control={<Radio />}
                          label={`${key}. ${value}`}
                        />
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
              ))}
              <Button
                variant="contained"
                color="success"
                onClick={handleScore}
                disabled={submitted}
                sx={{ mt: 2, py: 1.2, fontSize: '1rem' }}
              >
                {submitted ? 'Answers Submitted' : 'Submit Your Answers'}
              </Button>
            </Box>
          )}

          {/* Q&A */}
          {qna && qna.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" color="secondary" gutterBottom>
                Q & A
              </Typography>
              {qna.map((item, index) => (
                <Card key={index} sx={{ my: 2, p: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Q{index + 1}: {item.question}
                    </Typography>
                    <Typography variant="body2">
                      Answer: {item.answer}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {/* Feedback */}
          {score !== null && (
            <Card sx={{ my: 4, backgroundColor: '#e8f5e9' }}>
              <CardContent>
                <Typography variant="h5" color="green" gutterBottom>
                  Your Score: {score} / {feedback.length}
                </Typography>
                <Divider sx={{ my: 2 }} />
                {feedback.map((item, idx) => (
                  <Box key={idx} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" color={item.is_correct ? 'green' : 'red'}>
                      Q{item.id}: {item.is_correct ? 'Correct' : 'Incorrect'}
                    </Typography>
                    {!item.is_correct && (
                      <Collapse in>
                        <Typography>Your Answer: {item.your_answer}</Typography>
                        <Typography>Correct Answer: {item.correct}</Typography>
                        <Typography>Explanation: {item.explanation}</Typography>
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
