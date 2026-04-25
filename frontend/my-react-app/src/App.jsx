import { useState, useEffect, useRef } from 'react';
import { Layout, Typography, List, Input, Button, Card, ConfigProvider, theme as antTheme, Space, Divider } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, DeleteOutlined } from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const API_BASE = import.meta.env.VITE_API_BASE;

function App() {
    const [profile, setProfile] = useState({ language: 'English', learning_pace: 'Moderate Pace', depth_preference: 'Surface-Level', history: [] });
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const fetchProfile = () => {
        fetch(`${API_BASE}/profile/`)
            .then(res => res.json())
            .then(data => {
                setProfile(data);
                // Dynamically set AI greeting based on profile state
                if (messages.length === 0) {
                    if (data.history && data.history.length > 0) {
                        setMessages([{ role: 'ai', content: `Welcome back! Your preferences are set to ${data.language}. What concept would you like to explore next?` }]);
                    } else {
                        setMessages([{ role: 'ai', content: "Hello! I'm your Intelligent Learning Assistant. What language would you like to use today? (e.g., English, Spanish, French, Hindi)" }]);
                    }
                }
            })
            .catch(err => console.error("Failed to load profile:", err));
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const handleClearHistory = async () => {
        await fetch(`${API_BASE}/history/clear/`, { method: 'POST' });
        fetchProfile();
    };

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        // Language initial setup via chat
        if (messages.length === 1 && (!profile.history || profile.history.length === 0)) {
            try {
                await fetch(`${API_BASE}/profile/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ language: userMsg })
                });
                fetchProfile();
                setMessages(prev => [...prev, { role: 'ai', content: `Great, I'll communicate with you in ${userMsg}! As you requested, please tell me the topic or concept you want to learn:` }]);
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/chat/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ concept: userMsg })
            });
            const data = await res.json();
            
            fetchProfile();
            setMessages(prev => [...prev, { role: 'ai', content: data.response, isHtml: true }]);
        } catch (err) {
            console.error("Chat error", err);
            setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I couldn't connect to the backend." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ConfigProvider theme={{ algorithm: antTheme.darkAlgorithm, token: { colorPrimary: '#6366f1' } }}>
            <Layout style={{ height: '100vh' }}>
                <Sider width={320} style={{ padding: '24px', borderRight: '1px solid #303030' }} theme="dark">
                    <Title level={3} style={{ color: '#818cf8', marginBottom: '32px' }}>NeuLearn AI</Title>

                    <Card size="small" title="Behavioral Insights" bordered={false} style={{ marginBottom: '24px', background: '#1f1f1f' }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Pace:</Text>
                                <Text strong style={{ color: '#34d399' }}>{profile.learning_pace || 'Analyzing...'}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Depth:</Text>
                                <Text strong style={{ color: '#c084fc' }}>{profile.depth_preference || 'Analyzing...'}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">Language:</Text>
                                <Text strong style={{ color: '#60a5fa' }}>{profile.language || 'English'}</Text>
                            </div>
                        </Space>
                    </Card>

                    <Title level={5} type="secondary">Past Concepts</Title>
                    <List
                        size="small"
                        dataSource={profile.history ? [...profile.history].reverse() : []}
                        locale={{ emptyText: 'No topics learned yet.' }}
                        renderItem={(item) => (
                            <List.Item 
                                style={{ cursor: 'pointer', borderBottom: 'none', padding: '8px 0' }}
                                onClick={() => setInput(`Tell me more about ${item.concept}`)}
                            >
                                <Text className="hover:text-indigo-400 transition-colors">
                                    <span style={{ color: '#6366f1', marginRight: '8px' }}>•</span>{item.concept}
                                </Text>
                            </List.Item>
                        )}
                        style={{ overflowY: 'auto', maxHeight: '30vh', marginBottom: '16px' }}
                    />
                    
                    {profile.history?.length > 0 && (
                        <Button danger block icon={<DeleteOutlined />} onClick={handleClearHistory} ghost>
                            Reset History
                        </Button>
                    )}
                </Sider>

                <Layout>
                    <Header style={{ background: '#141414', borderBottom: '1px solid #303030', padding: '0 32px', display: 'flex', alignItems: 'center' }}>
                        <Title level={4} style={{ margin: 0 }}>Learn New Concepts</Title>
                    </Header>

                    <Content style={{ padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {messages.map((msg, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                <Space direction={msg.role === 'user' ? "horizontal-reverse" : "horizontal"} align="start">
                                    <div style={{
                                        width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: msg.role === 'ai' ? 'linear-gradient(135deg, #6366f1, #a855f7)' : '#334155', color: '#fff'
                                    }}>
                                        {msg.role === 'ai' ? <RobotOutlined /> : <UserOutlined />}
                                    </div>
                                    <Card 
                                        size="small" 
                                        bordered={false} 
                                        style={{ 
                                            maxWidth: '700px', 
                                            background: msg.role === 'user' ? '#4f46e5' : '#1f1f1f',
                                            borderRadius: msg.role === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0'
                                        }}
                                    >
                                        {msg.isHtml ? 
                                            <div dangerouslySetInnerHTML={{ __html: msg.content }} style={{ lineHeight: '1.6' }} /> 
                                            : <Paragraph style={{ margin: 0 }}>{msg.content}</Paragraph>
                                        }
                                    </Card>
                                </Space>
                            </div>
                        ))}
                        
                        {loading && (
                            <Space align="start">
                                <div style={{
                                    width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff'
                                }}>
                                    <RobotOutlined />
                                </div>
                                <Card size="small" bordered={false} style={{ background: '#1f1f1f', borderRadius: '16px 16px 16px 0' }}>
                                    <div className="loading-dots"><div className="dot"></div><div className="dot"></div><div className="dot"></div></div>
                                </Card>
                            </Space>
                        )}
                        <div ref={messagesEndRef} />
                    </Content>

                    <div style={{ padding: '24px 32px', background: '#141414', borderTop: '1px solid #303030' }}>
                        <Text type="secondary" style={{ display: 'block', marginBottom: '8px', fontSize: '12px' }}>
                            Type "Yes" or "No" to confirm if explanations make sense.
                        </Text>
                        <Space.Compact style={{ width: '100%' }} size="large">
                            <Input 
                                placeholder="Ask me anything..." 
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onPressEnter={handleSend}
                                style={{ background: '#1f1f1f', border: '1px solid #434343' }}
                            />
                            <Button type="primary" icon={<SendOutlined />} onClick={handleSend} loading={loading}>
                                Send
                            </Button>
                        </Space.Compact>
                    </div>
                </Layout>
            </Layout>
        </ConfigProvider>
    );
}

export default App;
