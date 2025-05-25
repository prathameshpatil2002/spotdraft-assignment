import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, TextField, Button, Box, List, ListItem, ListItemText, Chip, IconButton, Divider, CircularProgress, Alert } from '@mui/material';
import { Comment as CommentIcon, Send as SendIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { Document, Page } from 'react-pdf';
import { shares } from '../services/api';
import { Feed, Comment } from '../types';
import { toast } from 'react-toastify';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

// Configure PDF.js worker
import { pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const constructPdfUrl = (feedId: number | string): string => {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
    return `${baseUrl}/feeds/${feedId}/download`;
};

export const ViewSharedPDF: React.FC = () => {
    const { token } = useParams<{ token?: string }>();
    const [feed, setFeed] = useState<Feed | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [comment, setComment] = useState('');
    const [commenterName, setCommenterName] = useState('');
    const [numPages, setNumPages] = useState<number | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [pdfError, setPdfError] = useState<string | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const authToken = localStorage.getItem('token');
        setIsAuthenticated(!!authToken);
        loadPDF();
        loadComments();
    }, [token]);

    const loadPDF = async () => {
        try {
            setIsLoading(true);
            setPdfError(null);
            setPdfUrl(null);
            
            if (token) {
                const response = await shares.getSharedFile(token);
                if (!response.id) {
                    throw new Error('No feed ID received from server');
                }
                
                const url = constructPdfUrl(response.id);
                setPdfUrl(url);
                setFeed(response);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to load PDF');
            setPdfError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    const loadComments = async () => {
        try {
            setIsLoading(true);
            let response: Comment[] = [];
            if (token) {
                response = await shares.getComments(token);
            }
            setComments(Array.isArray(response) ? response : []);
        } catch (error) {
            toast.error('Failed to load comments');
            setComments([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleComment = async () => {
        try {
            console.log(token,commenterName,comment)
            setIsLoading(true);
            if (token && commenterName && comment) {
                await shares.addComment(token, commenterName, comment);
                setComment('');
                await loadComments();
                toast.success('Comment added successfully');
            }
        } catch (error) {
            toast.error('Failed to add comment');
        } finally {
            setIsLoading(false);
        }
    };


    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setPdfError(null);
    };

    const onDocumentLoadError = (error: Error) => {
        setPdfError(error.message);
        toast.error(`Failed to load PDF: ${error.message}`);
    };

    const renderCommentAuthor = (comment: Comment) => {
        if (comment.commenter_name) {
            return comment.commenter_name;
        }
        return 'Anonymous';
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {isAuthenticated ? (
                <Box sx={{ mb: 3 }}>
                <IconButton
                    onClick={() => navigate('/dashboard')}
                    sx={{ mr: 2 }}
                    color="primary"
                >
                    <ArrowBackIcon />
                </IconButton>
            </Box>
            ) : ''}
            
            <Box display="grid" gridTemplateColumns={"2fr 1fr"} gap={3}>
                <Paper sx={{ p: 3, minHeight: '80vh' }}>
                    {feed && (
                        <>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h5" gutterBottom>
                                    {feed.title}
                                </Typography>
                                {feed.description && (
                                    <Typography variant="body1" color="text.secondary" paragraph>
                                        {feed.description}
                                    </Typography>
                                )}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Shared by: {feed.host?.username || 'Unknown'}
                                    </Typography>
                                    <Chip
                                        icon={<CommentIcon />}
                                        label={`${feed.comment_count} comments`}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                    />
                                </Box>
                            </Box>
                            <Box sx={{ position: 'relative', minHeight: '500px' }}>
                                {isLoading && (
                                    <Box sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        textAlign: 'center'
                                    }}>
                                        <CircularProgress size={40} sx={{ mb: 2 }} />
                                        <Typography>Loading PDF...</Typography>
                                    </Box>
                                )}
                                {pdfError && (
                                    <Alert severity="error" sx={{ mb: 2 }}>
                                        <Typography>
                                            Error loading PDF: {pdfError}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Attempted to load: {pdfUrl}
                                        </Typography>
                                    </Alert>
                                )}
                                {pdfUrl && (
                                    <Document
                                        file={pdfUrl}
                                        onLoadSuccess={onDocumentLoadSuccess}
                                        onLoadError={onDocumentLoadError}
                                        loading={
                                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                                <CircularProgress size={40} sx={{ mb: 2 }} />
                                                <Typography>Loading PDF...</Typography>
                                            </Box>
                                        }
                                    >
                                        {Array.from(new Array(numPages || 0), (_, index) => (
                                            <Box key={`page_${index + 1}`} sx={{ mb: 2 }}>
                                                <Page
                                                    pageNumber={index + 1}
                                                    width={window.innerWidth * (0.5)}
                                                    loading={
                                                        <Box sx={{ textAlign: 'center', py: 2 }}>
                                                            <CircularProgress size={30} sx={{ mb: 1 }} />
                                                            <Typography variant="body2">
                                                                Loading page {index + 1}...
                                                            </Typography>
                                                        </Box>
                                                    }
                                                    error={
                                                        <Alert severity="error" sx={{ my: 1 }}>
                                                            Error loading page {index + 1}
                                                        </Alert>
                                                    }
                                                />
                                                <Divider sx={{ my: 2 }} />
                                            </Box>
                                        ))}
                                    </Document>
                                )}
                            </Box>
                        </>
                    )}
                </Paper>
                {
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Comments
                        </Typography>
                        <Box sx={{ mb: 3 }}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Add a comment..."
                                size="small"
                                sx={{ mb: 1 }}
                            />
                            {isAuthenticated ? '' : (<TextField
                                fullWidth
                                multiline
                                rows={1}
                                value={commenterName}
                                onChange={(e) => setCommenterName(e.target.value)}
                                placeholder="Your Name"
                                size="small"
                                sx={{ mb: 1 }}
                            />)}
                            <Button
                                variant="contained"
                                color="primary"
                                endIcon={<SendIcon />}
                                size="small"
                                onClick={handleComment}
                            >
                                Post Comment
                            </Button>
                        </Box>
                        <List>
                            {comments.length > 0 ? (
                                comments.map((comment) => (
                                    <React.Fragment key={comment.id}>
                                        <ListItem alignItems="flex-start">
                                            <ListItemText
                                                primary={
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {renderCommentAuthor(comment)}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Typography
                                                        variant="body2"
                                                        color="text.primary"
                                                        sx={{ mt: 0.5 }}
                                                    >
                                                        {comment.comment_body}
                                                    </Typography>
                                                }
                                            />
                                        </ListItem>
                                        <Divider component="li" />
                                    </React.Fragment>
                                ))
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 3 }}>
                                    <Typography color="text.secondary">
                                        No comments yet. Be the first to comment!
                                    </Typography>
                                </Box>
                            )}
                        </List>
                    </Paper>
                }
            </Box>
        </Container>
    );
}; 