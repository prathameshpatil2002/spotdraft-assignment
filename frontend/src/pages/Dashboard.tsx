import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Button,
    TextField,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Box,
    Chip,
    InputAdornment,
    ListItemSecondaryAction,
    Divider,
    Card,
    CardContent,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tab,
    Tabs,
    Alert,
} from '@mui/material';
import {
    Share as ShareIcon,
    Comment as CommentIcon,
    Search as SearchIcon,
    Upload as UploadIcon,
    Description as DescriptionIcon,
    CloudUpload as CloudUploadIcon,
    PictureAsPdf as PdfIcon,
    Link as LinkIcon,
    PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { feeds, shares } from '../services/api';
import { Feed } from '../types';
import { toast } from 'react-toastify';

export const Dashboard: React.FC = () => {
    const [pdfFiles, setPdfFiles] = useState<Feed[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'shared'>('all');
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [selectedFeedId, setSelectedFeedId] = useState<number | null>(null);
    const [shareEmail, setShareEmail] = useState('');
    const [isSharing, setIsSharing] = useState(false);
    const [shareError, setShareError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadPdfFiles();
    }, [activeTab]);

    const loadPdfFiles = async () => {
        try {
            if (activeTab === 'all') {
                const response = await feeds.getAll();
                setPdfFiles(response);
            } else {
                const response = await shares.getSharedWithMe();
                setPdfFiles(response);
            }
        } catch (error) {
            toast.error('Failed to load PDF files');
        }
    };

    const handleSearch = async () => {
        try {
            const results = await feeds.search(searchQuery);
            setPdfFiles(results);
        } catch (error) {
            toast.error('Search failed');
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title) {
            toast.error('Please provide both file and title');
            return;
        }

        try {
            await feeds.upload(file, title, description);
            toast.success('File uploaded successfully');
            setFile(null);
            setTitle('');
            setDescription('');
            loadPdfFiles();
        } catch (error) {
            toast.error('Upload failed');
        }
    };

    const handleShareLinkClick = async (feedId: number) => {
        try {
            const response = await shares.create(feedId);
            const shareUrl = `${window.location.origin}/view/shared/${response.share_token}`;
            navigator.clipboard.writeText(shareUrl);
            toast.success('Share link copied to clipboard!');
        } catch (error) {
            toast.error('Failed to create share link');
        }
    };

    const handleShareWithUserClick = (feedId: number) => {
        setSelectedFeedId(feedId);
        setShareEmail('');
        setShareError(null);
        setShareDialogOpen(true);
    };

    const handleShareWithUser = async () => {
        if (!selectedFeedId) return;
        
        setIsSharing(true);
        setShareError(null);
        
        try {
            await shares.shareWithUser(selectedFeedId, shareEmail);
            toast.success(`PDF shared with ${shareEmail} successfully!`);
            setShareDialogOpen(false);
        } catch (error: any) {
            const errorMsg = error.response?.data?.detail || 'Failed to share with user';
            setShareError(errorMsg);
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                <Box sx={{ flex: { xs: '1', md: '2' } }}>
                    <Paper sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h5" component="h1" sx={{ flexGrow: 1 }}>
                                My PDF Documents
                            </Typography>
                            <TextField
                                size="small"
                                placeholder="Search PDFs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                sx={{ width: 250 }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={handleSearch}>
                                                <SearchIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>

                        <Tabs
                            value={activeTab}
                            onChange={(_, newValue) => setActiveTab(newValue)}
                            sx={{ mb: 2 }}
                        >
                            <Tab label="All Documents" value="all" />
                            <Tab label="Shared With Me" value="shared" />
                        </Tabs>

                        <List>
                            {pdfFiles.length > 0 ? (
                                pdfFiles.map((pdf, index) => (
                                    <React.Fragment key={pdf.id}>
                                        {index > 0 && <Divider />}
                                        <ListItem
                                            sx={{
                                                py: 2,
                                                '&:hover': {
                                                    bgcolor: 'rgba(0, 0, 0, 0.02)',
                                                },
                                            }}
                                        >
                                            <DescriptionIcon sx={{ mr: 2, color: 'primary.main' }} />
                                            <ListItemText
                                                primary={
                                                    <Typography variant="subtitle1" component="div">
                                                        {pdf.title}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Box sx={{ mt: 0.5 }}>
                                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                                            {pdf.description || 'No description'}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Uploaded by: {pdf.host?.username || 'Unknown'}
                                                        </Typography>
                                                    </Box>
                                                }
                                                onClick={() => navigate(`/view/${pdf.id}`)}
                                                sx={{ cursor: 'pointer' }}
                                            />
                                            <ListItemSecondaryAction>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Chip
                                                        icon={<CommentIcon />}
                                                        label={pdf.comment_count}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                    <IconButton
                                                        onClick={() => handleShareLinkClick(pdf.id)}
                                                        size="small"
                                                        color="primary"
                                                        title="Create public share link"
                                                    >
                                                        <LinkIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        onClick={() => handleShareWithUserClick(pdf.id)}
                                                        size="small"
                                                        color="primary"
                                                        title="Share with user"
                                                    >
                                                        <PersonAddIcon />
                                                    </IconButton>
                                                </Box>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    </React.Fragment>
                                ))
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography color="text.secondary">
                                        {activeTab === 'all' ? 'No PDF documents found' : 'No PDFs shared with you'}
                                    </Typography>
                                </Box>
                            )}
                        </List>
                    </Paper>
                </Box>
                <Box sx={{ flex: { xs: '1', md: '1' } }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                <CloudUploadIcon color="primary" />
                                Upload New PDF
                            </Typography>
                            <form onSubmit={handleUpload}>
                                <Box
                                    component="label"
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        p: 3,
                                        border: '2px dashed',
                                        borderColor: 'primary.main',
                                        borderRadius: 2,
                                        bgcolor: 'background.default',
                                        transition: 'all 0.2s ease-in-out',
                                        cursor: 'pointer',
                                        minHeight: 180,
                                        '&:hover': {
                                            borderColor: 'primary.dark',
                                            bgcolor: 'primary.50',
                                        },
                                    }}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        (e.currentTarget as HTMLElement).style.borderColor = '#1976d2';
                                        (e.currentTarget as HTMLElement).style.backgroundColor = '#e3f2fd';
                                    }}
                                    onDragLeave={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        (e.currentTarget as HTMLElement).style.borderColor = '';
                                        (e.currentTarget as HTMLElement).style.backgroundColor = '';
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        (e.currentTarget as HTMLElement).style.borderColor = '';
                                        (e.currentTarget as HTMLElement).style.backgroundColor = '';
                                        const droppedFile = e.dataTransfer.files[0];
                                        if (droppedFile?.type === 'application/pdf') {
                                            setFile(droppedFile);
                                        } else {
                                            toast.error('Please upload a PDF file');
                                        }
                                    }}
                                >
                                    <input
                                        accept="application/pdf"
                                        type="file"
                                        onChange={(e) => {
                                            const selectedFile = e.target.files?.[0];
                                            if (selectedFile?.type === 'application/pdf') {
                                                setFile(selectedFile);
                                            } else {
                                                toast.error('Please upload a PDF file');
                                            }
                                        }}
                                        style={{ display: 'none' }}
                                    />
                                    {file ? (
                                        <Stack spacing={2} alignItems="center">
                                            <PdfIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                                            <Typography variant="body1" color="primary.main" sx={{ fontWeight: 500 }}>
                                                {file.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                                            </Typography>
                                            <Button
                                                size="small"
                                                color="error"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setFile(null);
                                                }}
                                            >
                                                Remove
                                            </Button>
                                        </Stack>
                                    ) : (
                                        <Stack spacing={2} alignItems="center">
                                            <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                                            <Typography variant="h6" color="primary.main" align="center">
                                                Drag & Drop PDF here
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" align="center">
                                                or click to browse
                                            </Typography>
                                        </Stack>
                                    )}
                                </Box>
                                <Stack spacing={2} sx={{ mt: 3 }}>
                                    <TextField
                                        label="Title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                        size="small"
                                        placeholder="Enter document title"
                                        error={!title && !!file}
                                        helperText={!title && !!file ? 'Title is required' : ''}
                                    />
                                    <TextField
                                        label="Description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        multiline
                                        rows={3}
                                        size="small"
                                        placeholder="Add a description (optional)"
                                    />
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        startIcon={<CloudUploadIcon />}
                                        disabled={!file || !title}
                                        sx={{
                                            py: 1.5,
                                            bgcolor: !file || !title ? 'action.disabledBackground' : 'primary.main',
                                            '&:hover': {
                                                bgcolor: 'primary.dark',
                                            },
                                        }}
                                    >
                                        Upload PDF
                                    </Button>
                                </Stack>
                            </form>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            {/* Share with user dialog */}
            <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Share with User</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Enter the email address of the user you want to share this PDF with.
                    </Typography>
                    {shareError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {shareError}
                        </Alert>
                    )}
                    <TextField
                        autoFocus
                        label="Email Address"
                        type="email"
                        fullWidth
                        value={shareEmail}
                        onChange={(e) => setShareEmail(e.target.value)}
                        placeholder="example@example.com"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <PersonAddIcon />
                                </InputAdornment>
                            ),
                        }}
                        error={!!shareError}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={handleShareWithUser} 
                        variant="contained" 
                        disabled={!shareEmail || isSharing}
                    >
                        {isSharing ? 'Sharing...' : 'Share'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}; 