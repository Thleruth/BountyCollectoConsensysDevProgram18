pragma solidity ^0.4.23;

/** @title SaferMath. */
library SaferMath {

    /**
      * @dev Add two values safely
      * @param a the first element to add
      * @param b the second element to add
      * @return result the result of the addition
      */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 result = a + b;
        assert(result - a == b);
        return result;
    }

    /**
      * @dev Multiple two values safely
      * @param a the first element to multiply
      * @param b the second element to multiply
      * @return result the result of the multiplication
      */
    function multiply(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0 || b ==0) return 0;
        uint256 result = a * b;
        assert(result / a == b);
        return result;
    }

    /**
      * @dev Divide two values safely
      * @param a the numerator
      * @param b the denominator
      * @return result the result of the division
      */
    function divide(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 result = a / b;
        assert(result * b == a);
        return result;
    }

    /**
      * @dev Subtract two values safely
      * @param a the element to subtract from
      * @param b the element to subtract by
      * @return result the result of the subtraction
      */
    function subtract(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 result = a - b;
        assert(result + b == a);
        return result;
    }

}
