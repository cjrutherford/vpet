import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export default class SaltEntity {
    // This entity can be used to store salts for password hashing
    // If you need to store salts, you can define columns here
    // For example, you might want to store a user ID and the salt value
    
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column()
    userId: string;
    
    @Column()
    salt: string;
}