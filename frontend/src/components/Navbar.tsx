import React from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    Container,
    IconButton,
    Avatar,
    Menu,
    MenuItem,
    Tooltip,
} from '@mui/material';
import {
    AccountCircle as AccountCircleIcon,
    Dashboard as DashboardIcon,
    Logout as LogoutIcon,
    Login as LoginIcon,
    PersonAdd as PersonAddIcon,
    Description as DescriptionIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Navbar: React.FC = () => {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleClose();
        logout();
    };

    return (
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider' }}>
            <Container maxWidth="lg">
                <Toolbar disableGutters>
                    <DescriptionIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1, color: 'primary.main' }} />
                    <Typography
                        variant="h6"
                        noWrap
                        component="div"
                        sx={{
                            mr: 2,
                            display: { xs: 'none', md: 'flex' },
                            fontWeight: 700,
                            color: 'text.primary',
                            textDecoration: 'none',
                            cursor: 'pointer',
                        }}
                        onClick={() => navigate('/')}
                    >
                        PDF Management & Collaboration System
                    </Typography>

                    <Box sx={{ flexGrow: 1 }} />

                    {isAuthenticated ? (
                        <>
                            <Button
                                color="inherit"
                                onClick={() => navigate('/dashboard')}
                                startIcon={<DashboardIcon />}
                                sx={{
                                    mr: 2,
                                    color: 'text.primary',
                                    '&:hover': { bgcolor: 'action.hover' },
                                }}
                            >
                                Dashboard
                            </Button>
                            <Tooltip title="Account settings">
                                <IconButton
                                    onClick={handleMenu}
                                    size="small"
                                    sx={{ ml: 2 }}
                                    aria-controls={Boolean(anchorEl) ? 'account-menu' : undefined}
                                    aria-haspopup="true"
                                    aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
                                >
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                        { <AccountCircleIcon />}
                                    </Avatar>
                                </IconButton>
                            </Tooltip>
                            <Menu
                                id="account-menu"
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleClose}
                                onClick={handleClose}
                                PaperProps={{
                                    elevation: 0,
                                    sx: {
                                        overflow: 'visible',
                                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                                        mt: 1.5,
                                        '& .MuiAvatar-root': {
                                            width: 32,
                                            height: 32,
                                            ml: -0.5,
                                            mr: 1,
                                        },
                                    },
                                }}
                                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                            >
                                <MenuItem onClick={handleLogout}>
                                    <LogoutIcon sx={{ mr: 2, fontSize: 20 }} />
                                    Logout
                                </MenuItem>
                            </Menu>
                        </>
                    ) : (
                        <>
                            <Button
                                color="inherit"
                                onClick={() => navigate('/login')}
                                startIcon={<LoginIcon />}
                                sx={{
                                    color: 'text.primary',
                                    '&:hover': { bgcolor: 'action.hover' },
                                    mr: 1,
                                }}
                            >
                                Login
                            </Button>
                            <Button
                                variant="contained"
                                onClick={() => navigate('/register')}
                                startIcon={<PersonAddIcon />}
                                sx={{ borderRadius: 2 }}
                            >
                                Register
                            </Button>
                        </>
                    )}
                </Toolbar>
            </Container>
        </AppBar>
    );
}; 