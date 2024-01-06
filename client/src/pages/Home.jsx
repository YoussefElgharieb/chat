import React,{useState, useEffect} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';

import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';

import background from '../assets/background.svg'; 

function Home() {
    const [room, setRoom] = useState('');
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [alert, setAlert] = useState('please enter a room');
    const location = useLocation();

    useEffect(()=> {
        if(location.state){
            console.log('rediret')
            setAlert('room is full try joining another room')
            setOpen(true);
        }
    },[])
    

    const redirect = (e) => {
        if(room != ''){
            navigate(`/${room}`)
        }
        else {
            setAlert('please enter a room')
        
            setOpen(true);
            e.stopPropagation();
        }
    }

    return ( 
        <>
            <Stack
                alignItems="center"
                justifyContent="center"
                noValidate
                autoComplete="off"
                sx = {{
                    height:'100vh',
                    backgroundImage: ` url(${background})`,
                }}
            >   
                <Paper 
                    component="form"
                    elevation={5}
                    sx = {{
                        p: 16,
                        bgcolor: `white`,
                    }}
                >   
                    <Typography variant="h4" component="h4" 
                        sx={{ 
                            flexGrow: 1, 
                            color: 'primary.main',
                            mb:3,
                        }}
                    >
                        start chatting
                    </Typography>
                    <TextField label="room name" variant="outlined" sx = {{width:'100%', mb:2}} onChange={(e)=>{setRoom(e.target.value)}} 
                        onKeyPress={
                            (e) => {
                                let key = e.key;
                                if(key == 'Enter'){
                                    e.preventDefault();
                                    redirect(e)
                                }
                            }
                        }
                    />
                    <Button variant="contained" sx = {{width:'100%', height:'56px'}} 
                        onClick={
                            (e)=> {
                                redirect(e)
                            }
                        }
                    >
                        join
                    </Button>   
                </Paper>
                <Snackbar
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    open={open}
                    onClose={() => {
                        setOpen(false);
                    }}
                    message= {alert}
                    ContentProps={{
                        sx: {
                            color:'error.contrastText',
                            bgcolor: "error.main"
                        }
                    }}

                    autoHideDuration={5000}
                />
            </Stack>
        </>
    );
}

export default Home;