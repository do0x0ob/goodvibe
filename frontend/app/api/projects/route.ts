import { NextResponse } from 'next/server';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { PACKAGE_ID, SUI_NETWORK } from '@/config/sui';
import { Project } from '@/types/project';

// Simple in-memory cache
let cachedProjects: Project[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

// Mock data
const MOCK_PROJECTS: Project[] = [
    {
        id: 'mock-1',
        title: 'Ocean Cleanup Initiative',
        description: 'Developing autonomous solar-powered vessels to collect plastic waste from coastal waters. Our goal is to deploy 50 units by the end of 2026.',
        category: 'Environment',
        imageUrl: 'https://images.unsplash.com/photo-1484291470158-b8f8d608850d?q=80&w=2070&auto=format&fit=crop',
        creator: '0x123...abc',
        raisedAmount: BigInt(50000_000_000), // 50,000 USDC
        supporterCount: 1240,
    },
    {
        id: 'mock-2',
        title: 'Open Source Education Platform',
        description: 'Building a decentralized, censorship-resistant educational platform for K-12 students in developing regions. Free access to quality curriculum for everyone.',
        category: 'Education',
        imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2132&auto=format&fit=crop',
        creator: '0x456...def',
        raisedAmount: BigInt(25000_000_000), // 25,000 USDC
        supporterCount: 856,
    },
    {
        id: 'mock-3',
        title: 'Wildlife Conservation Network',
        description: 'Protecting endangered species through technology-driven monitoring and anti-poaching systems. We use AI and satellite imaging to track and protect wildlife.',
        category: 'Wildlife',
        imageUrl: 'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?q=80&w=2076&auto=format&fit=crop',
        creator: '0x789...ghi',
        raisedAmount: BigInt(38500_000_000), // 38,500 USDC
        supporterCount: 1089,
    },
    {
        id: 'mock-4',
        title: 'Blockchain Healthcare Records',
        description: 'Creating a secure, patient-controlled electronic health record system using blockchain technology. Empowering patients with data sovereignty.',
        category: 'Healthcare',
        imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop',
        creator: '0xabc...jkl',
        raisedAmount: BigInt(62000_000_000), // 62,000 USDC
        supporterCount: 2134,
    },
    {
        id: 'mock-5',
        title: 'Open Source AI Research',
        description: 'Democratizing AI research by building open-source large language models. Making advanced AI accessible to researchers worldwide.',
        category: 'Technology',
        imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2070&auto=format&fit=crop',
        creator: '0xdef...mno',
        raisedAmount: BigInt(95000_000_000), // 95,000 USDC
        supporterCount: 3456,
    },
    {
        id: 'mock-6',
        title: 'Community Food Bank Network',
        description: 'Building a decentralized network of community food banks with transparent donation tracking. Fighting hunger through technology and community.',
        category: 'Community',
        imageUrl: 'https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?q=80&w=2070&auto=format&fit=crop',
        creator: '0xghi...pqr',
        raisedAmount: BigInt(18900_000_000), // 18,900 USDC
        supporterCount: 678,
    },
    {
        id: 'mock-7',
        title: 'Digital Art Archive',
        description: 'Preserving and democratizing access to cultural art heritage through high-resolution digitization and NFT authentication.',
        category: 'Arts & Culture',
        imageUrl: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?q=80&w=2080&auto=format&fit=crop',
        creator: '0xjkl...stu',
        raisedAmount: BigInt(29500_000_000), // 29,500 USDC
        supporterCount: 892,
    },
    {
        id: 'mock-8',
        title: 'Climate Change Research Hub',
        description: 'Funding cutting-edge climate research and carbon capture technology. Supporting scientists working on solutions to the climate crisis.',
        category: 'Research',
        imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=2070&auto=format&fit=crop',
        creator: '0xmno...vwx',
        raisedAmount: BigInt(73200_000_000), // 73,200 USDC
        supporterCount: 2567,
    },
    {
        id: 'mock-9',
        title: 'Reforestation Initiative',
        description: 'Planting one million trees in deforested regions using drone technology. Restoring ecosystems and fighting climate change.',
        category: 'Environment',
        imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2013&auto=format&fit=crop',
        creator: '0xpqr...yza',
        raisedAmount: BigInt(44000_000_000), // 44,000 USDC
        supporterCount: 1567,
    },
    {
        id: 'mock-10',
        title: 'STEM Education for Girls',
        description: 'Empowering young women through free STEM education programs in underserved communities. Building the next generation of female scientists and engineers.',
        category: 'Education',
        imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022&auto=format&fit=crop',
        creator: '0xstu...bcd',
        raisedAmount: BigInt(31500_000_000), // 31,500 USDC
        supporterCount: 1123,
    },
    {
        id: 'mock-11',
        title: 'Mental Health Support Network',
        description: 'Building a decentralized peer support platform for mental health. Connecting people who need help with trained volunteers.',
        category: 'Healthcare',
        imageUrl: 'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?q=80&w=2070&auto=format&fit=crop',
        creator: '0xvwx...efg',
        raisedAmount: BigInt(21800_000_000), // 21,800 USDC
        supporterCount: 789,
    },
    {
        id: 'mock-12',
        title: 'Endangered Species Gene Bank',
        description: 'Preserving genetic material from endangered species for future conservation efforts. A genetic ark for biodiversity.',
        category: 'Wildlife',
        imageUrl: 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?q=80&w=2076&auto=format&fit=crop',
        creator: '0xyza...hij',
        raisedAmount: BigInt(56700_000_000), // 56,700 USDC
        supporterCount: 1876,
    },
];

const suiClient = new SuiClient({
    url: getFullnodeUrl(SUI_NETWORK as 'mainnet' | 'testnet' | 'devnet' | 'localnet'),
});

export async function GET() {
    console.log('Fetching projects...');
    const now = Date.now();

    // Return cached data if valid
    if (cachedProjects && (now - lastFetchTime < CACHE_TTL)) {
        console.log('Returning cached projects');
        const serializedProjects = cachedProjects.map(p => ({
            ...p,
            raisedAmount: p.raisedAmount.toString(),
        }));
        return NextResponse.json(serializedProjects);
    }

    try {
        let realProjects: Project[] = [];

        // Only fetch if PACKAGE_ID is configured
        if (PACKAGE_ID) {
            console.log('Fetching from chain with PACKAGE_ID:', PACKAGE_ID);
            const events = await suiClient.queryEvents({
                query: { MoveEventType: `${PACKAGE_ID}::project::ProjectCreated` },
                // Limit to recent events or implement pagination if needed
                limit: 50, 
            });

            realProjects = events.data.map((event) => {
                const parsed = event.parsedJson as any;
                return {
                    id: parsed.project_id,
                    title: parsed.title,
                    description: parsed.description,
                    category: parsed.category,
                    imageUrl: parsed.cover_url,
                    creator: event.sender,
                    raisedAmount: BigInt(0), // In a real app, we might need to fetch objects to get current state
                    supporterCount: 0,
                } as Project;
            });
            console.log(`Fetched ${realProjects.length} projects from chain`);
        } else {
            console.log('PACKAGE_ID not configured, skipping chain fetch');
        }

        // Merge mock and real projects
        const allProjects = [...realProjects, ...MOCK_PROJECTS];
        
        // Update cache
        cachedProjects = allProjects;
        lastFetchTime = now;

        // Note: BigInt cannot be directly serialized to JSON
        const serializedProjects = allProjects.map(p => ({
            ...p,
            raisedAmount: p.raisedAmount.toString(),
        }));

        console.log('Returning projects:', serializedProjects.length);
        return NextResponse.json(serializedProjects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        // Fallback to mocks on error
        const serializedMocks = MOCK_PROJECTS.map(p => ({
            ...p,
            raisedAmount: p.raisedAmount.toString(),
        }));
        return NextResponse.json(serializedMocks);
    }
}
