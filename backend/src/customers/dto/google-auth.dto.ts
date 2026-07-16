import { IsString, IsNotEmpty } from 'class-validator';

export class GoogleAuthDto {
  /**
   * The ID token (JWT) issued by Google Identity Services in the browser.
   * Verified server-side against Google's public certs — never trusted as-is.
   */
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
