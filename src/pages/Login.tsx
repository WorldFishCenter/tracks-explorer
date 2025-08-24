import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Smartphone, Lock, Info, AlertTriangle, Languages, Check } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { LANGUAGE_FLAGS, SUPPORTED_LANGUAGES } from '../constants/languages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Login: React.FC = () => {
  const [imei, setImei] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useTranslation();
  const { languages, currentLanguage, changeLanguage } = useLanguage();

  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Trim inputs to handle any accidental whitespace
    const trimmedImei = imei.trim();
    const trimmedPassword = password.trim();
    
    if (!trimmedImei || !trimmedPassword) {
      setError(t('auth.enterBothFields'));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await login(trimmedImei, trimmedPassword);
      // Login successful, navigation happens in the App component
    } catch (err) {
      setError(t('auth.invalidCredentials'));
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md mx-auto p-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/favicon/favicon-96x96.png" 
              alt={t('common.peskasLogo')} 
              width="48" 
              height="48" 
              className="mr-3" 
            />
            <div>
              <h1 className="text-3xl font-bold text-foreground">PESKAS</h1>
              <p className="text-sm text-muted-foreground">Fishers Tracking Portal</p>
            </div>
          </div>
          
          {/* Language switcher */}
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[140px] h-12">
                  <span className="text-lg mr-2">{currentLanguage.flag}</span>
                  <span>{currentLanguage.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>{t('language.selectLanguage')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {languages.map((language) => (
                  <DropdownMenuItem
                    key={language.code}
                    onClick={() => handleLanguageChange(language.code)}
                    className="flex items-center justify-between min-h-[44px]"
                  >
                    <div className="flex items-center">
                      <span className="text-base mr-2">{language.flag}</span>
                      <span>{language.name}</span>
                    </div>
                    {currentLanguage.code === language.code && (
                      <Check size={16} className="text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('auth.loginTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {t('auth.loginInfo')}
              </AlertDescription>
            </Alert>

            {error && (
              <>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{t('auth.troubleshootingTitle')}</strong>
                    <ul className="mt-2 space-y-1">
                      {(t('auth.troubleshootingTips', { returnObjects: true }) as string[]).map((tip: string, index: number) => (
                        <li key={index}>• {tip}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imei">{t('auth.imeiOrBoatName')}</Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="imei"
                    type="text"
                    placeholder={t('common.enterImeiOrBoatName')}
                    value={imei}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImei(e.target.value)}
                    autoComplete="off"
                    disabled={loading}
                    required
                    className="pl-10"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('common.exampleImeiOrBoatName')}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('common.yourPassword')}
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={loading}
                    required
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('common.loading')}...
                  </>
                ) : t('auth.loginButton')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login; 