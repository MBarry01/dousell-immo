'use client';

// @next
import NextLink from 'next/link';

// @mui
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// @third-party
import { motion } from 'framer-motion';

// @project
import branding from '@/branding.json';
import GraphicsCard from '@/components/saasable/ui/cards/GraphicsCard';
import ContainerWrapper from '@/components/saasable/ui/ContainerWrapper';
import Copyright from '@/components/saasable/components/footer/Copyright';
import FollowUS from '@/components/saasable/components/footer/FollowUS';
import Sitemap from '@/components/saasable/components/footer/Sitemap';
import LogoSection from '@/components/saasable/components/logo/LogoSection';

import { CopyrightType } from '@/components/saasable/enum';
import { SECTION_COMMON_PY } from '@/components/saasable/utils/constant';

export default function Footer7() {
    const logoFollowContent = (
        <Stack sx={{ alignItems: 'flex-start', gap: { xs: 1.5, sm: 3 } }}>
            <LogoSection />
            <Typography variant="h6" sx={{ maxWidth: { sm: 280 }, mb: { xs: -1, sm: -2.5 } }}>
                v1.0.0
            </Typography>
            <Typography variant="body2" sx={{ maxWidth: { sm: 280 } }}>
                {/* @ts-ignore */}
                Revolutionizing real estate with {branding.brandName}.
            </Typography>
        </Stack>
    );

    return (
        <ContainerWrapper sx={{ py: SECTION_COMMON_PY }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                    duration: 0.5,
                    delay: 0.4
                }}
            >
                <Stack id="footer-7" role="contentinfo" rel="noopener noreferrer" aria-label="Footer 7" sx={{ gap: { xs: 3, sm: 4, md: 5 } }}>
                    <Grid container spacing={{ xs: 4, md: 3 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Stack direction={{ sm: 'row', md: 'column' }} sx={{ gap: 3, justifyContent: 'space-between', height: 1 }}>
                                {logoFollowContent}
                            </Stack>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            {/* @ts-ignore */}
                            <Sitemap isMenuDesign />
                        </Grid>
                    </Grid>
                    <GraphicsCard sx={{ borderRadius: { xs: 6, sm: 8 } }}>
                        <Stack
                            direction={{ sm: 'row' }}
                            sx={{
                                alignItems: 'center',
                                justifyContent: { xs: 'center', sm: 'space-between' },
                                gap: 1.5,
                                py: { xs: 2, sm: 1.5 },
                                px: { xs: 2, sm: 3 }
                            }}
                        >
                            <Copyright type={CopyrightType.TYPE3} />
                            <FollowUS heading={false} color="grey.100" />
                        </Stack>
                    </GraphicsCard>
                </Stack>
            </motion.div>
        </ContainerWrapper>
    );
}
