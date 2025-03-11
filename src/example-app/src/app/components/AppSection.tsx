'use client';
import { MeetingType } from '~/types/MeetingType';
import { Button } from './button';

interface AppSectionProps {
    header: string;
    description: string;
    children: React.ReactNode;
}

export default function AppSection({ header, description, children }: AppSectionProps) {
    return (
        <section>
            <h2 className="text-2xl font-bold tracking-tight">{header}</h2>
            <p className="text-muted-foreground">{description}</p>

            <div className={'p-4 pt-0'}>
                {children}
            </div>
        </section>
    );
}
