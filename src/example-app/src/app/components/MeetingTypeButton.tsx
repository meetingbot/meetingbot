'use client';
import { MeetingType } from '~/types/MeetingType';
import { Button } from './button';

export default function MeetingTypeButton({type, onPress, active}: {type: MeetingType, onPress: (type: MeetingType) => void, active: MeetingType}) {
    
    const update = () => {
        onPress(type); 
    }

    //Save
    const selected = type === active;

    return (
        // <Button onClick={update} className={(selected ? selectedStyle : '') + " " + style}>
        <Button onClick={update} variant={selected ? 'outline' : 'ghost'} className={selected ? 'font-bold' : ''}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
        </Button>
    );
}
